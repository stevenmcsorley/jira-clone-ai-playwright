import {
  GitProvider,
  RepoBranch,
  RepoCommit,
  RepoInfo,
  RepoPullRequest,
} from './git-provider.interface'

export interface GitHubAdapterConfig {
  owner: string
  repo: string
  /** Optional: public repos are readable unauthenticated (rate-limited). */
  token?: string | null
  defaultBranch?: string | null
}

/**
 * GitHub REST API v3 adapter.
 *
 * Uses the global `fetch`. When a token is present it is sent as a Bearer
 * credential; when absent, requests go out unauthenticated so public repos
 * still work (subject to GitHub's lower anonymous rate limit).
 */
export class GitHubAdapter implements GitProvider {
  private readonly base = 'https://api.github.com'

  constructor(private readonly config: GitHubAdapterConfig) {}

  private get repoPath(): string {
    return `repos/${encodeURIComponent(this.config.owner)}/${encodeURIComponent(
      this.config.repo,
    )}`
  }

  private async request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ossicone-git-integration',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`
    }

    let response: Response
    try {
      response = await fetch(`${this.base}/${path}`, { headers })
    } catch (err) {
      throw new Error(
        `GitHub request failed: ${err instanceof Error ? err.message : 'network error'}`,
      )
    }

    if (response.status === 401) {
      throw new Error('GitHub authentication failed: invalid or expired token (401)')
    }
    if (response.status === 403) {
      // Distinguish rate-limiting from permission problems where possible.
      const remaining = response.headers.get('x-ratelimit-remaining')
      if (remaining === '0') {
        throw new Error(
          'GitHub rate limit exceeded. Add a Personal Access Token to raise the limit (403).',
        )
      }
      throw new Error('GitHub access forbidden: token lacks required scope (403)')
    }
    if (response.status === 404) {
      throw new Error(
        `GitHub repository not found or not accessible: ${this.config.owner}/${this.config.repo} (404)`,
      )
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`GitHub request failed (${response.status}): ${body.slice(0, 200)}`)
    }

    return (await response.json()) as T
  }

  async getRepoInfo(): Promise<RepoInfo> {
    const data = await this.request<{
      full_name: string
      description: string | null
      default_branch: string
      html_url: string
      private: boolean
    }>(this.repoPath)

    return {
      fullName: data.full_name,
      description: data.description ?? null,
      defaultBranch: data.default_branch,
      url: data.html_url,
      private: data.private,
    }
  }

  async listCommits(branch: string | undefined, limit: number): Promise<RepoCommit[]> {
    const sha = branch || this.config.defaultBranch || undefined
    const params = new URLSearchParams({ per_page: String(limit) })
    if (sha) params.set('sha', sha)

    const data = await this.request<
      Array<{
        sha: string
        html_url: string
        commit: {
          message: string
          author: { name?: string; date?: string } | null
        }
        author: { login?: string; avatar_url?: string } | null
      }>
    >(`${this.repoPath}/commits?${params.toString()}`)

    return data.map(item => ({
      sha: item.sha,
      shortSha: item.sha.slice(0, 7),
      message: item.commit.message.split('\n')[0],
      author: item.author?.login || item.commit.author?.name || 'Unknown',
      authorAvatar: item.author?.avatar_url ?? null,
      date: item.commit.author?.date ?? '',
      url: item.html_url,
    }))
  }

  async listBranches(): Promise<RepoBranch[]> {
    const data = await this.request<
      Array<{ name: string; protected?: boolean }>
    >(`${this.repoPath}/branches?per_page=100`)

    return data.map(item => ({
      name: item.name,
      protected: Boolean(item.protected),
    }))
  }

  async listPullRequests(): Promise<RepoPullRequest[]> {
    const data = await this.request<
      Array<{
        number: number
        title: string
        state: string
        html_url: string
        created_at: string
        user: { login?: string } | null
        head: { ref?: string } | null
      }>
    >(`${this.repoPath}/pulls?state=all&per_page=30&sort=created&direction=desc`)

    return data.map(item => ({
      number: item.number,
      title: item.title,
      state: item.state,
      author: item.user?.login || 'Unknown',
      url: item.html_url,
      createdAt: item.created_at,
      branch: item.head?.ref || '',
    }))
  }
}
