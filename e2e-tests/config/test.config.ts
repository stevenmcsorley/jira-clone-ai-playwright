import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface TestConfig {
  // Application URLs
  baseUrl: string;
  apiUrl: string;

  // Test project configuration
  testProject: {
    id?: number;
    name: string;
    key: string;
    description: string;
  };

  // Test user configuration
  testUser: {
    id?: number;
    email: string;
    name: string;
    password?: string;
  };

  // Test execution settings
  execution: {
    headless: boolean;
    slowMo: number;
    timeout: number;
    retries: number;
    viewport: {
      width: number;
      height: number;
    };
  };

  // Test data management
  dataManagement: {
    cleanupAfterTests: boolean;
    preserveTestProject: boolean;
    useExistingProject: boolean;
  };
}

const defaultConfig: TestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:4000/api',

  testProject: {
    name: process.env.TEST_PROJECT_NAME || 'E2E Test Project',
    key: process.env.TEST_PROJECT_KEY || 'E2E',
    description: process.env.TEST_PROJECT_DESC || 'Automated E2E testing project for Jira clone',
  },

  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    name: process.env.TEST_USER_NAME || 'Test User',
    password: process.env.TEST_USER_PASSWORD || 'testpass123',
  },

  execution: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '50'),
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    retries: parseInt(process.env.TEST_RETRIES || '1'),
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || '1280'),
      height: parseInt(process.env.VIEWPORT_HEIGHT || '720'),
    },
  },

  dataManagement: {
    cleanupAfterTests: process.env.CLEANUP_AFTER_TESTS !== 'false',
    preserveTestProject: process.env.PRESERVE_TEST_PROJECT === 'true',
    useExistingProject: process.env.USE_EXISTING_PROJECT === 'true',
  },
};

export const getTestConfig = (): TestConfig => {
  // Allow override via specific project ID
  if (process.env.TEST_PROJECT_ID) {
    defaultConfig.testProject.id = parseInt(process.env.TEST_PROJECT_ID);
    defaultConfig.dataManagement.useExistingProject = true;
  }

  if (process.env.TEST_USER_ID) {
    defaultConfig.testUser.id = parseInt(process.env.TEST_USER_ID);
  }

  return defaultConfig;
};

export const testConfig = getTestConfig();