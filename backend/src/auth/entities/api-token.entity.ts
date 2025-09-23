import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('api_tokens')
export class ApiToken {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 64, unique: true })
  token: string

  @Column({ length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date

  @Column({ default: true })
  isActive: boolean

  @Column('json', { default: [] })
  scopes: string[]

  @ManyToOne(() => User, { eager: true })
  user: User

  @Column()
  userId: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}