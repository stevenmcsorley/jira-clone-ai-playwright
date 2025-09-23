import { BaseApiService } from './base.service'
import type { User } from '../../types/domain.types'

export class UsersService extends BaseApiService {
  static async getAll(): Promise<User[]> {
    return this.get<User[]>('/users')
  }

  static async getById(id: number): Promise<User> {
    return this.get<User>(`/users/${id}`)
  }
}