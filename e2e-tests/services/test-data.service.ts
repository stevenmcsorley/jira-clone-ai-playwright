import { apiService, Project, User, Issue, Sprint } from './api.service';
import { testConfig } from '../config/test.config';

interface TestDataContext {
  project?: Project;
  users?: User[];
  issues?: Issue[];
  sprints?: Sprint[];
  testUser?: User;
}

class TestDataService {
  private testContext: TestDataContext = {};

  async initializeTestData(): Promise<TestDataContext> {
    console.log('🚀 Initializing test data...');

    try {
      // Get or create test user
      await this.setupTestUser();

      // Get or create test project
      await this.setupTestProject();

      console.log('✅ Test data initialization complete');
      console.log(`📊 Project: ${this.testContext.project?.name} (ID: ${this.testContext.project?.id})`);
      console.log(`👤 User: ${this.testContext.testUser?.name} (ID: ${this.testContext.testUser?.id})`);

      return this.testContext;
    } catch (error) {
      console.error('❌ Failed to initialize test data:', error);
      throw error;
    }
  }

  private async setupTestUser(): Promise<void> {
    try {
      let testUser: User | undefined;

      // If user ID is specified, try to get that specific user first
      if (testConfig.testUser.id) {
        try {
          testUser = await apiService.getUser(testConfig.testUser.id);
          console.log(`🔍 Using configured user ID: ${testConfig.testUser.id}`);
        } catch (error) {
          console.log(`⚠️ User ID ${testConfig.testUser.id} not found, trying by email...`);
        }
      }

      // Fallback to finding by email if no ID specified or user not found
      if (!testUser) {
        const existingUsers = await apiService.getUsers();
        testUser = existingUsers.find(u => u.email === testConfig.testUser.email);

        if (!testUser && testConfig.testUser.password) {
          console.log(`📝 Creating test user: ${testConfig.testUser.email}`);
          testUser = await apiService.createUser({
            email: testConfig.testUser.email,
            name: testConfig.testUser.name,
            password: testConfig.testUser.password,
          });
        } else if (!testUser) {
          // Use the first available user if test user doesn't exist and no password provided
          testUser = existingUsers[0];
          if (!testUser) {
            throw new Error('No users available and cannot create test user without password');
          }
        }
      }

      this.testContext.testUser = testUser;

      // Update config with actual user ID
      testConfig.testUser.id = testUser.id;
    } catch (error) {
      console.error('Failed to setup test user:', error);
      throw error;
    }
  }

  private async setupTestProject(): Promise<void> {
    try {
      let testProject: Project | undefined;

      if (testConfig.dataManagement.useExistingProject && testConfig.testProject.id) {
        // Use existing project by ID
        console.log(`🔍 Using existing project with ID: ${testConfig.testProject.id}`);
        testProject = await apiService.getProject(testConfig.testProject.id);
      } else {
        // Look for existing project by name or key
        const existingProjects = await apiService.getProjects();
        testProject = existingProjects.find(
          p => p.name === testConfig.testProject.name || p.key === testConfig.testProject.key
        );

        if (!testProject || !testConfig.dataManagement.useExistingProject) {
          // Create new test project
          console.log(`📝 Creating test project: ${testConfig.testProject.name}`);

          if (!this.testContext.testUser) {
            throw new Error('Test user must be set up before creating project');
          }

          testProject = await apiService.createProject({
            name: testConfig.testProject.name,
            key: testConfig.testProject.key,
            description: testConfig.testProject.description,
            leadId: this.testContext.testUser.id,
          });
        }
      }

      this.testContext.project = testProject;

      // Update config with actual project ID
      testConfig.testProject.id = testProject.id;
    } catch (error) {
      console.error('Failed to setup test project:', error);
      throw error;
    }
  }

  async createTestIssue(overrides: Partial<Issue> = {}): Promise<Issue> {
    if (!this.testContext.project || !this.testContext.testUser) {
      throw new Error('Test context not initialized. Call initializeTestData() first.');
    }

    const issueData = {
      title: `Test Issue ${Date.now()}`,
      description: 'This is a test issue created by automated tests',
      type: 'story' as const,
      priority: 'medium' as const,
      projectId: this.testContext.project.id,
      reporterId: this.testContext.testUser.id,
      ...overrides,
    };

    const issue = await apiService.createIssue(issueData);

    if (!this.testContext.issues) {
      this.testContext.issues = [];
    }
    this.testContext.issues.push(issue);

    return issue;
  }

  async createTestSprint(overrides: Partial<Sprint> = {}): Promise<Sprint> {
    if (!this.testContext.project) {
      throw new Error('Test context not initialized. Call initializeTestData() first.');
    }

    const sprintData = {
      name: `Test Sprint ${Date.now()}`,
      goal: 'Complete test scenarios for automated testing',
      projectId: this.testContext.project.id,
      ...overrides,
    };

    const sprint = await apiService.createSprint(sprintData);

    if (!this.testContext.sprints) {
      this.testContext.sprints = [];
    }
    this.testContext.sprints.push(sprint);

    return sprint;
  }

  async createTestIssuesWithStoryPoints(): Promise<Issue[]> {
    const issues = await Promise.all([
      this.createTestIssue({
        title: 'Small Feature',
        storyPoints: 2,
        priority: 'low',
      }),
      this.createTestIssue({
        title: 'Medium Feature',
        storyPoints: 5,
        priority: 'medium',
      }),
      this.createTestIssue({
        title: 'Large Feature',
        storyPoints: 8,
        priority: 'high',
      }),
      this.createTestIssue({
        title: 'Epic Feature',
        storyPoints: 13,
        priority: 'urgent',
        type: 'epic',
      }),
    ]);

    return issues;
  }

  async cleanupTestData(): Promise<void> {
    console.log('🧹 Cleaning up test data...');

    try {
      if (testConfig.dataManagement.cleanupAfterTests && this.testContext.project) {
        await apiService.cleanupTestData(this.testContext.project.id);

        // Clean up test user if created
        if (this.testContext.testUser &&
            this.testContext.testUser.email === testConfig.testUser.email &&
            !testConfig.dataManagement.preserveTestProject) {
          await apiService.deleteUser(this.testContext.testUser.id);
        }
      }

      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      // Don't throw here as it shouldn't fail the tests
    }
  }

  getTestContext(): TestDataContext {
    return this.testContext;
  }

  getTestProject(): Project {
    if (!this.testContext.project) {
      throw new Error('Test project not initialized. Call initializeTestData() first.');
    }
    return this.testContext.project;
  }

  getTestUser(): User {
    if (!this.testContext.testUser) {
      throw new Error('Test user not initialized. Call initializeTestData() first.');
    }
    return this.testContext.testUser;
  }
}

export const testDataService = new TestDataService();