import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
  }

  // Issue events
  emitIssueCreated(issue: any) {
    this.server.emit('issue:created', issue)
  }

  emitIssueUpdated(issue: any) {
    this.server.emit('issue:updated', issue)
  }

  emitIssueDeleted(issueId: number) {
    this.server.emit('issue:deleted', { id: issueId })
  }

  // Sprint events
  emitSprintCreated(sprint: any) {
    this.server.emit('sprint:created', sprint)
  }

  emitSprintUpdated(sprint: any) {
    this.server.emit('sprint:updated', sprint)
  }

  emitSprintStarted(sprint: any) {
    this.server.emit('sprint:started', sprint)
  }

  emitSprintCompleted(sprint: any) {
    this.server.emit('sprint:completed', sprint)
  }

  emitSprintDeleted(sprintId: number) {
    this.server.emit('sprint:deleted', { id: sprintId })
  }
}