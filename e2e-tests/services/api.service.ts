import { testConfig } from '../config/test.config';

export interface Project {
  id: number;
  name: string;
  key: string;
  description: string;
  leadId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: number;
  title: string;
  description?: string;
  type: 'bug' | 'story' | 'task' | 'epic';
  status: 'todo' | 'in_progress' | 'code_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  storyPoints?: number;
  projectId: number;
  assigneeId?: number;
  reporterId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  projectId: number;
  issues: Issue[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLogEntry {
  id: number;
  timeSpent: string;
  description: string;
  issueId: number;
  userId: number;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = testConfig.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Project management
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(project: {
    name: string;
    key: string;
    description: string;
    leadId: number;
  }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // User management
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(user: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Issue management
  async getIssues(projectId?: number): Promise<Issue[]> {
    const endpoint = projectId ? `/projects/${projectId}/issues` : '/issues';
    return this.request<Issue[]>(endpoint);
  }

  async getIssue(id: number): Promise<Issue> {
    return this.request<Issue>(`/issues/${id}`);
  }

  async createIssue(issue: {
    title: string;
    description?: string;
    type: 'bug' | 'story' | 'task' | 'epic';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    storyPoints?: number;
    projectId: number;
    assigneeId?: number;
    reporterId: number;
  }): Promise<Issue> {
    return this.request<Issue>('/issues', {
      method: 'POST',
      body: JSON.stringify(issue),
    });
  }

  async updateIssue(id: number, updates: Partial<Issue>): Promise<Issue> {
    return this.request<Issue>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteIssue(id: number): Promise<void> {
    await this.request(`/issues/${id}`, {
      method: 'DELETE',
    });
  }

  // Sprint management
  async getSprints(projectId: number): Promise<Sprint[]> {
    return this.request<Sprint[]>(`/projects/${projectId}/sprints`);
  }

  async getSprint(id: number): Promise<Sprint> {
    return this.request<Sprint>(`/sprints/${id}`);
  }

  async createSprint(sprint: {
    name: string;
    goal?: string;
    projectId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Sprint> {
    return this.request<Sprint>('/sprints', {
      method: 'POST',
      body: JSON.stringify(sprint),
    });
  }

  async startSprint(id: number): Promise<Sprint> {
    return this.request<Sprint>(`/sprints/${id}/start`, {
      method: 'POST',
    });
  }

  async completeSprint(id: number): Promise<Sprint> {
    return this.request<Sprint>(`/sprints/${id}/complete`, {
      method: 'POST',
    });
  }

  async addIssueToSprint(sprintId: number, issueId: number): Promise<void> {
    await this.request(`/sprints/${sprintId}/issues/${issueId}`, {
      method: 'POST',
    });
  }

  async removeIssueFromSprint(sprintId: number, issueId: number): Promise<void> {
    await this.request(`/sprints/${sprintId}/issues/${issueId}`, {
      method: 'DELETE',
    });
  }

  async deleteSprint(id: number): Promise<void> {
    await this.request(`/sprints/${id}`, {
      method: 'DELETE',
    });
  }

  // Time tracking
  async logTime(entry: {
    timeSpent: string;
    description: string;
    issueId: number;
    userId: number;
  }): Promise<TimeLogEntry> {
    return this.request<TimeLogEntry>('/time-logs', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async getTimeEntries(issueId: number): Promise<TimeLogEntry[]> {
    return this.request<TimeLogEntry[]>(`/issues/${issueId}/time-logs`);
  }

  async updateTimeEntry(id: number, updates: Partial<TimeLogEntry>): Promise<TimeLogEntry> {
    return this.request<TimeLogEntry>(`/time-logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTimeEntry(id: number): Promise<void> {
    await this.request(`/time-logs/${id}`, {
      method: 'DELETE',
    });
  }

  // Test data cleanup
  async cleanupTestData(projectId?: number): Promise<void> {
    if (projectId) {
      // Delete all sprints for the project
      const sprints = await this.getSprints(projectId);
      for (const sprint of sprints) {
        await this.deleteSprint(sprint.id);
      }

      // Delete all issues for the project
      const issues = await this.getIssues(projectId);
      for (const issue of issues) {
        await this.deleteIssue(issue.id);
      }

      // Delete the project if it's a test project
      if (!testConfig.dataManagement.preserveTestProject) {
        await this.deleteProject(projectId);
      }
    }
  }
}

export const apiService = new ApiService();