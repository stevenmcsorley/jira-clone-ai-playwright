import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProjectRepo } from './entities/project-repo.entity'
import { GitProviderFactory } from './git-provider.factory'
import { SetRepoDto } from './dto/set-repo.dto'
import {
  RepoBranch,
  RepoCommit,
  RepoPullRequest,
} from './providers/git-provider.interface'

export interface RedactedRepoConfig {
  projectId: number
  provider: string
  owner: string
  repo: string
  defaultBranch: string | null
  hasToken: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Accepts a clean owner/repo, a trailing ".git", or a full clone URL pasted
 * into either field, and returns a normalised { owner, repo }.
 *   "widget.git"                              → repo "widget"
 *   "https://github.com/acme/widget.git"      → owner "acme", repo "widget"
 *   "git@github.com:acme/widget.git"          → owner "acme", repo "widget"
 */
function normaliseOwnerRepo(rawOwner: string, rawRepo: string): { owner: string; repo: string } {
  let owner = (rawOwner || '').trim()
  let repo = (rawRepo || '').trim()

  const url = `${owner} ${repo}`.match(/(?:github\.com[/:])([^/\s]+)\/([^/\s]+)/i)
  if (url) {
    owner = url[1]
    repo = url[2]
  }

  const clean = (s: string) => s.replace(/^[/\s]+|[/\s]+$/g, '')
  owner = clean(owner)
  repo = clean(repo).replace(/\.git$/i, '')
  return { owner, repo }
}

@Injectable()
export class GitService {
  constructor(
    @InjectRepository(ProjectRepo)
    private readonly repos: Repository<ProjectRepo>,
    private readonly factory: GitProviderFactory,
  ) {}

  /** Loads the config including the (normally hidden) token column. */
  private async loadWithToken(projectId: number): Promise<ProjectRepo | null> {
    return this.repos
      .createQueryBuilder('r')
      .addSelect('r.token')
      .where('r.projectId = :projectId', { projectId })
      .getOne()
  }

  /** Public config: never includes the token, only whether one is set. */
  async getConfig(projectId: number): Promise<RedactedRepoConfig | null> {
    const config = await this.loadWithToken(projectId)
    if (!config) return null
    return this.redact(config)
  }

  private redact(config: ProjectRepo): RedactedRepoConfig {
    return {
      projectId: config.projectId,
      provider: config.provider,
      owner: config.owner,
      repo: config.repo,
      defaultBranch: config.defaultBranch,
      hasToken: Boolean(config.token),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  }

  async setConfig(projectId: number, dto: SetRepoDto): Promise<RedactedRepoConfig> {
    const existing = await this.loadWithToken(projectId)

    // Keep the existing token when the caller omits it on update. An explicit
    // empty string clears it (public read); a non-empty value replaces it.
    const token =
      dto.token === undefined ? (existing?.token ?? null) : dto.token === '' ? null : dto.token

    // Normalise owner/repo so a pasted clone URL or a trailing ".git" works:
    // e.g. "https://github.com/acme/widget.git" or "widget.git" → owner acme, repo widget.
    const { owner, repo } = normaliseOwnerRepo(dto.owner, dto.repo)

    const entity = this.repos.create({
      ...(existing ?? {}),
      projectId,
      provider: dto.provider,
      owner,
      repo,
      defaultBranch: dto.defaultBranch?.trim() || null,
      token,
    })

    const saved = await this.repos.save(entity)
    return this.redact(saved)
  }

  async deleteConfig(projectId: number): Promise<void> {
    const existing = await this.repos.findOne({ where: { projectId } })
    if (!existing) throw new NotFoundException('No repository connected')
    await this.repos.remove(existing)
  }

  private async provider(projectId: number) {
    const config = await this.loadWithToken(projectId)
    if (!config) throw new NotFoundException('No repository connected')
    return this.factory.create(config)
  }

  async commits(
    projectId: number,
    branch: string | undefined,
    limit: number,
  ): Promise<RepoCommit[]> {
    return (await this.provider(projectId)).listCommits(branch, limit)
  }

  async branches(projectId: number): Promise<RepoBranch[]> {
    return (await this.provider(projectId)).listBranches()
  }

  async pulls(projectId: number): Promise<RepoPullRequest[]> {
    return (await this.provider(projectId)).listPullRequests()
  }
}
