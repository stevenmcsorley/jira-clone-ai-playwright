import { Injectable } from '@nestjs/common'
import { GitProvider } from './providers/git-provider.interface'
import { GitHubAdapter } from './providers/github.adapter'
import { ProjectRepo } from './entities/project-repo.entity'

/**
 * Builds the correct GitProvider adapter for a stored repo config.
 *
 * Adding a new provider (Bitbucket, GitLab) is a single new `case` here plus
 * its adapter class — no caller changes required.
 */
@Injectable()
export class GitProviderFactory {
  create(config: ProjectRepo): GitProvider {
    switch (config.provider) {
      case 'github':
        return new GitHubAdapter({
          owner: config.owner,
          repo: config.repo,
          token: config.token,
          defaultBranch: config.defaultBranch,
        })
      default:
        throw new Error(`Unsupported git provider: ${config.provider}`)
    }
  }
}
