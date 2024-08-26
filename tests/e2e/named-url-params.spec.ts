import { test, expect } from './base';

test.describe('Named URL Params', () => {
  test.describe('With hostname', () => {
    runTests('https://example.com');
  });

  test.describe('Without hostname', () => {
    runTests();
  });

  function runTests(hostnamePrefix = '') {
    test('Support named param', async ({ page, intercept }) => {
      const getRequest = intercept.get({
        url: `${hostnamePrefix}/callback/:id/:name`,
        handler: ({ route, params }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: `Speaks for itself: ${params.id}${params.name}`,
          });
        },
      });

      await page.locator('#url').fill(`${hostnamePrefix}/callback/123/456`);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      await expect(page.getByText('Speaks for itself: 123456')).toBeVisible();

      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(2);

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Support named param & wildcard URLs', async ({ page, intercept }) => {
      const getRequest = intercept.get({
        url: `${hostnamePrefix}/callback/*/:id`,
        handler: ({ route, params }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: `Speaks for itself: ${params.id}`,
          });
        },
      });

      await page.locator('#url').fill(`${hostnamePrefix}/callback/test/123`);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('Speaks for itself: 123')).toBeVisible();

      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(2);

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Support single named param', async ({ page, intercept }) => {
      const getRequest = intercept.get({
        url: `${hostnamePrefix}/:id`,
        handler: ({ route, params }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: `Speaks for itself: ${params.id}`,
          });
        },
      });

      await page.locator('#url').fill(`${hostnamePrefix}/123`);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('Speaks for itself: 123')).toBeVisible();

      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(2);

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });
  }
});
