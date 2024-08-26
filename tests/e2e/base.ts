import { Intercept } from '../../dist';
import { test as base, expect } from '@playwright/test';
import path from 'path';

type BaseFixtures = {
  intercept: Intercept;
};

const test = base.extend<BaseFixtures>({
  intercept: async ({ page }, use) => {
    await use(
      new Intercept(page, {
        fixturePathPrefix: path.join(process.cwd(), 'tests/e2e'),
      })
    );
  },
  page: async ({ page }, use) => {
    const intercept = new Intercept(page, {
      fixturePathPrefix: path.join(process.cwd(), 'tests/e2e'),
    });

    const mockAppGet = intercept.get({
      url: 'https://example.com',
      fixture: 'mock-app/index.html',
    });

    await page.goto('https://example.com');

    await mockAppGet.wait();

    await use(page);
  },
});

export { test, expect };
