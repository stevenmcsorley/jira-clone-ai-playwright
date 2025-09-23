import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { CreateProjectDto } from './dto/create-project.dto'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepository.create(createProjectDto)
    return this.projectsRepository.save(project)
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ['lead', 'issues'],
    })
  }

  async findOne(id: number): Promise<Project> {
    return this.projectsRepository.findOne({
      where: { id },
      relations: ['lead', 'issues', 'issues.assignee', 'issues.reporter'],
    })
  }

  async update(id: number, updateData: Partial<Project>): Promise<Project> {
    await this.projectsRepository.update(id, updateData)
    return this.findOne(id)
  }

  async remove(id: number): Promise<void> {
    await this.projectsRepository.delete(id)
  }
}