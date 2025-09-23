import { Before, After, setWorldConstructor } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

export class PlaywrightWorld {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  contextData: Record<string, any> = {};

  constructor() {
    // Store test context data
    this.context = {} as any;
  }

  // Helper method for column selectors
  getColumnSelector(columnName: string): string {
    const columnMapping: Record<string, string> = {
      'To Do': 'text=To Do',
      'In Progress': 'text=In Progress',
      'Code Review': 'text=Code Review',
      'Done': 'text=Done'
    };

    const baseSelector = columnMapping[columnName];
    if (!baseSelector) {
      throw new Error(`Unknown column: ${columnName}`);
    }

    return `${baseSelector}:visible >> xpath=../..`;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 50
    });

    this.context = await this.browser.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:5173',
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      video: 'retain-on-failure',
      screenshot: 'only-on-failure'
    });

    this.page = await this.context.newPage();

    // Set up console logging for debugging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console Error: ${msg.text()}`);
      }
    });

    // Set up request failure logging
    this.page.on('requestfailed', request => {
      console.log(`Request failed: ${request.url()}`);
    });
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

setWorldConstructor(PlaywrightWorld);

Before(async function (this: PlaywrightWorld) {
  await this.init();
});

After(async function (this: PlaywrightWorld) {
  await this.cleanup();
});