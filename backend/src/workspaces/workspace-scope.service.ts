import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '../projects/entities/project.entity'
import { Issue } from '../issues/entities/issue.entity'

/**
 * Workspace ownership assertions used by every scoped controller.
 * Out-of-workspace resources 404 (not 403) so their existence isn't leaked.
 */
@Injectable()
export class WorkspaceScopeService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Issue)
    private readonly issuesRepository: Repository<Issue>,
  ) {}

  async assertProject(projectId: number, workspaceId: number): Promise<void> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      select: ['id', 'workspaceId'],
    })
    if (!project || project.workspaceId !== workspaceId) {
      throw new NotFoundException('Project not found')
    }
  }

  async assertIssue(issueId: number, workspaceId: number): Promise<void> {
    const issue = await this.issuesRepository.findOne({
      where: { id: issueId },
      select: ['id', 'projectId'],
    })
    if (!issue) throw new NotFoundException('Issue not found')
    await this.assertProject(issue.projectId, workspaceId)
  }

  async projectIds(workspaceId: number): Promise<number[]> {
    const projects = await this.projectsRepository.find({
      where: { workspaceId },
      select: ['id'],
    })
    return projects.map(p => p.id)
  }
}
