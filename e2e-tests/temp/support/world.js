"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaywrightWorld = void 0;
const cucumber_1 = require("@cucumber/cucumber");
const test_1 = require("@playwright/test");
class PlaywrightWorld {
    constructor() {
        this.contextData = {};
        // Store test context data
        this.context = {};
    }
    // Helper method for column selectors
    getColumnSelector(columnName) {
        const columnMapping = {
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
        this.browser = await test_1.chromium.launch({
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
exports.PlaywrightWorld = PlaywrightWorld;
(0, cucumber_1.setWorldConstructor)(PlaywrightWorld);
(0, cucumber_1.Before)(async function () {
    await this.init();
});
(0, cucumber_1.After)(async function () {
    await this.cleanup();
});
