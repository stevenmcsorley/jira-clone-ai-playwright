/**
 * Provider-agnostic git integration contract.
 *
 * Every hosting provider (GitHub now; Bitbucket/GitLab later) is implemented
 * as an adapter that maps its own API payloads onto these shapes. Callers
 * (GitService/GitController) depend only on this interface, never on a
 * concrete provider — the GitProviderFactory decides which adapter to build.
 */

export interface RepoInfo {
  fullName: string
  description: string | null
  defaultBranch: string
  url: string
  private: boolean
}

export interface RepoCommit {
  sha: string
  shortSha: string
  message: string
  author: string
  authorAvatar: string | null
  date: string
  url: string
}

export interface RepoBranch {
  name: string
  protected: boolean
}

export interface RepoPullRequest {
  number: number
  title: string
  state: string
  author: string
  url: string
  createdAt: string
  branch: string
}

export interface GitProvider {
  getRepoInfo(): Promise<RepoInfo>
  listCommits(branch: string | undefined, limit: number): Promise<RepoCommit[]>
  listBranches(): Promise<RepoBranch[]>
  listPullRequests(): Promise<RepoPullRequest[]>
}
