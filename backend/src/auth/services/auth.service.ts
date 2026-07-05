import { Injectable, UnauthorizedException, ForbiddenException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../../users/entities/user.entity'
import { Workspace } from '../../workspaces/entities/workspace.entity'
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne()

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password')
    }

    return this.issueSession(user.id)
  }

  /** Sign a JWT for the user and return the session payload the SPA expects. */
  async issueSession(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException()
    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email })
    return { token, user }
  }

  static get openSignup(): boolean {
    return process.env.OPEN_SIGNUP === 'true'
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :userId', { userId })
      .getOne()
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect')
    }
    await this.userRepository.update(userId, {
      password: await bcrypt.hash(newPassword, 10),
    })
    return { changed: true }
  }

  /** Self-service signup: create the account and a personal workspace, sign in. */
  async register(email: string, name: string, password: string) {
    if (!AuthService.openSignup) {
      throw new ForbiddenException('Sign-up is invite-only on this instance')
    }
    const existing = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne()
    if (existing) throw new ConflictException('An account with that email already exists')

    const user = await this.userRepository.save(
      this.userRepository.create({
        email: email.toLowerCase(),
        name,
        password: await bcrypt.hash(password, 10),
      }),
    )
    const workspace = await this.workspaceRepository.save(
      this.workspaceRepository.create({ name: `${name}'s workspace` }),
    )
    await this.memberRepository.save(
      this.memberRepository.create({ workspaceId: workspace.id, userId: user.id, role: 'owner' }),
    )
    return this.issueSession(user.id)
  }
}
