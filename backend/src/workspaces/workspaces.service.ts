import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as crypto from 'crypto'
import { Workspace } from './entities/workspace.entity'
import { WorkspaceMember, WorkspaceRole } from './entities/workspace-member.entity'
import { WorkspaceInvite } from './entities/workspace-invite.entity'
import { User } from '../users/entities/user.entity'

const INVITE_TTL_DAYS = 14

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(WorkspaceInvite)
    private readonly inviteRepository: Repository<WorkspaceInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createWorkspace(name: string, ownerId: number): Promise<Workspace> {
    const workspace = await this.workspaceRepository.save(
      this.workspaceRepository.create({ name }),
    )
    await this.memberRepository.save(
      this.memberRepository.create({ workspaceId: workspace.id, userId: ownerId, role: 'owner' }),
    )
    return workspace
  }

  async findForUser(userId: number): Promise<Array<Workspace & { role: WorkspaceRole }>> {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['workspace'],
      order: { id: 'ASC' },
    })
    return memberships.map(m => ({ ...m.workspace, role: m.role }))
  }

  async getMembership(workspaceId: number, userId: number): Promise<WorkspaceMember | null> {
    return this.memberRepository.findOne({ where: { workspaceId, userId } })
  }

  async rename(workspaceId: number, name: string): Promise<Workspace> {
    await this.workspaceRepository.update(workspaceId, { name })
    return this.workspaceRepository.findOne({ where: { id: workspaceId } })
  }

  async listMembers(workspaceId: number) {
    const members = await this.memberRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { id: 'ASC' },
    })
    return members.map(m => ({
      id: m.id,
      role: m.role,
      user: { id: m.user.id, name: m.user.name, email: m.user.email, avatar: m.user.avatar },
      joinedAt: m.createdAt,
    }))
  }

  async changeRole(workspaceId: number, memberId: number, role: WorkspaceRole, actingUserId: number) {
    const member = await this.memberRepository.findOne({ where: { id: memberId, workspaceId } })
    if (!member) throw new NotFoundException('Member not found')
    if (member.role === 'owner' && role !== 'owner') {
      const owners = await this.memberRepository.count({ where: { workspaceId, role: 'owner' } })
      if (owners <= 1) throw new BadRequestException('A workspace needs at least one owner')
    }
    member.role = role
    return this.memberRepository.save(member)
  }

  async removeMember(workspaceId: number, memberId: number, actingUserId: number) {
    const member = await this.memberRepository.findOne({ where: { id: memberId, workspaceId } })
    if (!member) throw new NotFoundException('Member not found')
    if (member.userId === actingUserId) {
      throw new BadRequestException('You cannot remove yourself — transfer ownership or leave instead')
    }
    if (member.role === 'owner') {
      throw new ForbiddenException('Owners cannot be removed — change their role first')
    }
    await this.memberRepository.delete(member.id)
  }

  // ---------- invites ----------

  async createInvite(workspaceId: number, email: string, role: WorkspaceRole, invitedById: number) {
    if (role === 'owner') throw new BadRequestException('Invite as admin or member; ownership is transferred separately')
    const existingUser = await this.userRepository.findOne({ where: { email } })
    if (existingUser) {
      const existingMember = await this.getMembership(workspaceId, existingUser.id)
      if (existingMember) throw new BadRequestException('That person is already a member')
    }
    const invite = await this.inviteRepository.save(
      this.inviteRepository.create({
        workspaceId,
        email: email.toLowerCase(),
        role,
        token: crypto.randomBytes(24).toString('hex'),
        invitedById,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      }),
    )
    return invite
  }

  async listInvites(workspaceId: number) {
    const invites = await this.inviteRepository.find({
      where: { workspaceId },
      order: { id: 'DESC' },
    })
    return invites.map(i => ({
      id: i.id,
      email: i.email,
      role: i.role,
      token: i.token,
      expiresAt: i.expiresAt,
      accepted: !!i.acceptedAt,
      createdAt: i.createdAt,
    }))
  }

  async revokeInvite(workspaceId: number, inviteId: number) {
    const result = await this.inviteRepository.delete({ id: inviteId, workspaceId })
    if (!result.affected) throw new NotFoundException('Invite not found')
  }

  async getInviteByToken(token: string): Promise<WorkspaceInvite> {
    const invite = await this.inviteRepository.findOne({ where: { token }, relations: ['workspace'] })
    if (!invite) throw new NotFoundException('Invite not found')
    if (invite.acceptedAt) throw new BadRequestException('Invite already used')
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired')
    return invite
  }

  /** Adds userId to the invite's workspace and marks the invite used. */
  async acceptInvite(invite: WorkspaceInvite, userId: number) {
    const existing = await this.getMembership(invite.workspaceId, userId)
    if (!existing) {
      await this.memberRepository.save(
        this.memberRepository.create({
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        }),
      )
    }
    invite.acceptedAt = new Date()
    await this.inviteRepository.save(invite)
  }
}
