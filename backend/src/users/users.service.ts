import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity'
import { CreateUserDto } from './dto/create-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(WorkspaceMember)
    private membersRepository: Repository<WorkspaceMember>,
  ) {}

  async create(createUserDto: CreateUserDto, workspaceId?: number): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    })
    const saved = await this.usersRepository.save(user)
    if (workspaceId) {
      await this.membersRepository.save(
        this.membersRepository.create({ workspaceId, userId: saved.id, role: 'member' }),
      )
    }
    delete saved.password
    return saved
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find()
  }

  /** Users visible inside a workspace = its members. */
  async findByWorkspace(workspaceId: number): Promise<User[]> {
    const memberships = await this.membersRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { id: 'ASC' },
    })
    return memberships.map(m => m.user)
  }

  async findOne(id: number): Promise<User> {
    return this.usersRepository.findOne({ where: { id } })
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } })
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }
    await this.usersRepository.update(id, updateData)
    return this.findOne(id)
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id)
  }
}
