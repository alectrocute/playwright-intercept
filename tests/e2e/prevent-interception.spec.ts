import { test as base, expect } from '@playwright/test';
import { Intercept } from '../../dist';
import path from 'path';

type BaseFixtures = {
  intercept: Intercept;
};

const test = base.extend<BaseFixtures>({
  intercept: async ({ page }, use) => {
    await use(
      new Intercept(page, {
        fixturePathPrefix: path.join(process.cwd(), 'tests'),
        staticExtensions: ['jpg', 'png'],
      })
    );
  },
});

test.describe('Prevent Interception', () => {
  test('Skip interception of static extension', async ({ page, intercept }) => {
    await page.goto('https://example.com/test.jpg');
    expect(intercept.unhandledRequests).toHaveLength(0);
    await page.goto('https://example.com/test.png');
    expect(intercept.unhandledRequests).toHaveLength(0);
    await page.goto('https://example.com');
    expect(intercept.unhandledRequests).toHaveLength(1);
    await page.goto('https://example.com/test.html');
    expect(intercept.unhandledRequests).toHaveLength(2);
  });

  test('Skip interception of static extension with query parameter', async ({
    page,
    intercept,
  }) => {
    await page.goto('https://example.com/test.jpg?test=true');
    expect(intercept.unhandledRequests).toHaveLength(0);
    await page.goto('https://example.com/test.png?test=true');
    expect(intercept.unhandledRequests).toHaveLength(0);
    await page.goto('https://example.com/test.html?test=true');
    expect(intercept.unhandledRequests).toHaveLength(1);
  });

  test('Skip interception of static extension with multiple query parameters', async ({
    page,
    intercept,
  }) => {
    await page.goto(
      'https://example.com/test.jpg?test=true&test2=false&test3=foo'
    );

    expect(intercept.unhandledRequests).toHaveLength(0);

    await page.goto(
      'https://example.com/test.png?test=true&test2=false&test3=foo'
    );

    expect(intercept.unhandledRequests).toHaveLength(0);

    await page.goto(
      'https://example.com/test.html?test=true&test2=false&test3=foo'
    );

    expect(intercept.unhandledRequests).toHaveLength(1);
  });

  test('Prevent intercepting any manually skipped URLs', async ({
    page,
    intercept,
  }) => {
    await page.goto('https://example.com/');

    expect(intercept.unhandledRequests).toHaveLength(1);

    await intercept.addIgnoredUrl('https://example.com/');

    await page.goto('https://example.com/');

    expect(intercept.unhandledRequests).toHaveLength(1);
  });
});
