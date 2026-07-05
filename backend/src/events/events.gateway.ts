import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '../projects/entities/project.entity'
import { Issue } from '../issues/entities/issue.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  // projectId -> workspaceId cache so emits don't hit the DB every time
  private readonly projectWorkspaceCache = new Map<number, number>()

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Issue)
    private readonly issuesRepository: Repository<Issue>,
    @InjectRepository(WorkspaceMember)
    private readonly membersRepository: Repository<WorkspaceMember>,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
  }

  // Clients authenticate and pick their workspace room after connecting.
  // Events are only broadcast to the room of the workspace they belong to.
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token?: string; workspaceId?: number }
  ) {
    try {
      const workspaceId = Number(data?.workspaceId)
      if (!data?.token || !workspaceId) {
        return { joined: false, error: 'token and workspaceId are required' }
      }

      const payload = this.jwtService.verify(data.token)
      const userId = payload?.sub
      if (!userId) {
        return { joined: false, error: 'Invalid token' }
      }

      const membership = await this.membersRepository.findOne({
        where: { workspaceId, userId },
      })
      if (!membership) {
        return { joined: false, error: 'Not a member of that workspace' }
      }

      // Leave any previously joined workspace rooms before joining the new one
      for (const room of Array.from(client.rooms)) {
        if (room.startsWith('ws:')) {
          client.leave(room)
        }
      }
      client.join(`ws:${workspaceId}`)
      return { joined: true, workspaceId }
    } catch (error) {
      return { joined: false, error: 'Invalid token' }
    }
  }

  /**
   * Resolve the workspace an event belongs to. Prefers the projectId on the
   * payload; falls back to looking the issue up by id. Returns null when the
   * workspace can't be determined — in that case the event is dropped rather
   * than broadcast across workspaces.
   */
  private async resolveWorkspaceId(projectId?: number, issueId?: number): Promise<number | null> {
    let resolvedProjectId = projectId

    if (!resolvedProjectId && issueId) {
      const issue = await this.issuesRepository.findOne({
        where: { id: issueId },
        select: ['id', 'projectId'],
      })
      resolvedProjectId = issue?.projectId
    }

    if (!resolvedProjectId) return null

    const cached = this.projectWorkspaceCache.get(resolvedProjectId)
    if (cached) return cached

    const project = await this.projectsRepository.findOne({
      where: { id: resolvedProjectId },
      select: ['id', 'workspaceId'],
    })
    if (!project?.workspaceId) return null

    this.projectWorkspaceCache.set(resolvedProjectId, project.workspaceId)
    return project.workspaceId
  }

  private async emitToWorkspace(event: string, payload: any, projectId?: number, issueId?: number) {
    const workspaceId = await this.resolveWorkspaceId(projectId, issueId)
    if (!workspaceId) return // can't attribute the event to a workspace — drop it
    this.server.to(`ws:${workspaceId}`).emit(event, payload)
  }

  // Issue events
  emitIssueCreated(issue: any) {
    void this.emitToWorkspace('issue:created', issue, issue?.projectId, issue?.id)
  }

  emitIssueUpdated(issue: any) {
    void this.emitToWorkspace('issue:updated', issue, issue?.projectId, issue?.id)
  }

  emitIssueDeleted(issueId: number, projectId?: number) {
    void this.emitToWorkspace('issue:deleted', { id: issueId }, projectId)
  }

  // Notification events — the workspace is already known, so target the room
  // directly. Every member of the workspace receives it; clients filter by
  // their own userId (acceptable within a workspace).
  emitNotification(workspaceId: number, notification: any) {
    if (!workspaceId) return
    this.server.to(`ws:${workspaceId}`).emit('notification:new', notification)
  }

  // Sprint events
  emitSprintCreated(sprint: any) {
    void this.emitToWorkspace('sprint:created', sprint, sprint?.projectId)
  }

  emitSprintUpdated(sprint: any) {
    void this.emitToWorkspace('sprint:updated', sprint, sprint?.projectId)
  }

  emitSprintStarted(sprint: any) {
    void this.emitToWorkspace('sprint:started', sprint, sprint?.projectId)
  }

  emitSprintCompleted(sprint: any) {
    void this.emitToWorkspace('sprint:completed', sprint, sprint?.projectId)
  }

  emitSprintDeleted(sprintId: number, projectId?: number) {
    void this.emitToWorkspace('sprint:deleted', { id: sprintId }, projectId)
  }
}
