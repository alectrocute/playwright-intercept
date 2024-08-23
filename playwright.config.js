import { defineConfig, devices } from '@playwright/test';

const config = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 5 : undefined,
  reporter: [
    ['html', { outputFolder: '.playwright-report' }],
    ['list'],
    ['json', { outputFile: '.playwright-report/report.json' }],
  ],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Webkit'] },
    },
  ],
});

if (process.env.CI) {
  config.reporter.push(['github']);
}

export default config;
