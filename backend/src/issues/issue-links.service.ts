import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IssueLink, IssueLinkType } from './entities/issue-link.entity'
import { Issue } from './entities/issue.entity'

interface CreateIssueLinkDto {
  sourceIssueId: number
  targetIssueId: number
  linkType: IssueLinkType
  createdById: number
}

@Injectable()
export class IssueLinksService {
  constructor(
    @InjectRepository(IssueLink)
    private issueLinksRepository: Repository<IssueLink>,
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
  ) {}

  async create(createIssueLinkDto: CreateIssueLinkDto): Promise<IssueLink> {
    // Check if both issues exist
    const [sourceIssue, targetIssue] = await Promise.all([
      this.issuesRepository.findOne({ where: { id: createIssueLinkDto.sourceIssueId } }),
      this.issuesRepository.findOne({ where: { id: createIssueLinkDto.targetIssueId } }),
    ])

    if (!sourceIssue || !targetIssue) {
      throw new Error('One or both issues not found')
    }

    // Check if link already exists
    const existingLink = await this.issueLinksRepository.findOne({
      where: [
        {
          sourceIssueId: createIssueLinkDto.sourceIssueId,
          targetIssueId: createIssueLinkDto.targetIssueId,
          linkType: createIssueLinkDto.linkType,
        },
        // Also check reverse relationship for bidirectional links
        {
          sourceIssueId: createIssueLinkDto.targetIssueId,
          targetIssueId: createIssueLinkDto.sourceIssueId,
          linkType: this.getReverseLinkType(createIssueLinkDto.linkType),
        },
      ],
    })

    if (existingLink) {
      throw new Error('Issue link already exists')
    }

    const issueLink = this.issueLinksRepository.create(createIssueLinkDto)
    return this.issueLinksRepository.save(issueLink)
  }

  async findByIssueId(issueId: number): Promise<IssueLink[]> {
    return this.issueLinksRepository.find({
      where: [
        { sourceIssueId: issueId },
        { targetIssueId: issueId },
      ],
      relations: ['sourceIssue', 'targetIssue', 'createdBy'],
    })
  }

  async remove(id: number): Promise<void> {
    await this.issueLinksRepository.delete(id)
  }

  async searchIssues(query: string, projectId?: number): Promise<Issue[]> {
    const queryBuilder = this.issuesRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.assignee', 'assignee')
      .leftJoinAndSelect('issue.reporter', 'reporter')

    // Check if query is numeric (issue ID prefix search)
    const isNumericQuery = /^\d+$/.test(query.trim())

    if (isNumericQuery) {
      // Search by issue ID prefix - convert to string for LIKE search
      const idPrefix = query.trim()
      queryBuilder.where('CAST(issue.id AS TEXT) LIKE :idPrefix', { idPrefix: `${idPrefix}%` })
    } else {
      // Search by title or check if query contains "JC-" or similar pattern
      const issueKeyMatch = query.match(/^(?:JC-?)(\d+)/i)
      if (issueKeyMatch) {
        // Extract the numeric part and do a prefix search on IDs
        const idPrefix = issueKeyMatch[1]
        queryBuilder.where('CAST(issue.id AS TEXT) LIKE :idPrefix', { idPrefix: `${idPrefix}%` })
      } else {
        // Pure title search
        queryBuilder.where('LOWER(issue.title) LIKE LOWER(:query)', { query: `%${query}%` })
      }
    }

    if (projectId) {
      queryBuilder.andWhere('issue.projectId = :projectId', { projectId })
    }

    return queryBuilder
      .orderBy('issue.id', 'ASC') // Order by ID for prefix searches to show JC-2, JC-20, JC-21, etc.
      .limit(10)
      .getMany()
  }

  private getReverseLinkType(linkType: IssueLinkType): IssueLinkType {
    const reverseMap: Record<IssueLinkType, IssueLinkType> = {
      [IssueLinkType.BLOCKS]: IssueLinkType.BLOCKED_BY,
      [IssueLinkType.BLOCKED_BY]: IssueLinkType.BLOCKS,
      [IssueLinkType.DUPLICATES]: IssueLinkType.DUPLICATED_BY,
      [IssueLinkType.DUPLICATED_BY]: IssueLinkType.DUPLICATES,
      [IssueLinkType.RELATES_TO]: IssueLinkType.RELATES_TO,
      [IssueLinkType.CAUSES]: IssueLinkType.CAUSED_BY,
      [IssueLinkType.CAUSED_BY]: IssueLinkType.CAUSES,
      [IssueLinkType.CLONES]: IssueLinkType.CLONED_BY,
      [IssueLinkType.CLONED_BY]: IssueLinkType.CLONES,
      [IssueLinkType.CHILD_OF]: IssueLinkType.PARENT_OF,
      [IssueLinkType.PARENT_OF]: IssueLinkType.CHILD_OF,
    }
    return reverseMap[linkType]
  }
}