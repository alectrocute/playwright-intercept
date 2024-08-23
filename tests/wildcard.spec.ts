import { test, expect } from './base';

test.describe('Wildcard', () => {
  test.describe('With hostname', () => {
    runTests('https://example.com');
  });

  test.describe('Without hostname', () => {
    runTests();
  });

  function runTests(hostnamePrefix = '') {
    test('Support wildcard URLs', async ({ page, intercept }) => {
      const successFlag = 'Speaks for itself';

      const getRequest = intercept.get({
        url: `${hostnamePrefix}/callback/*/*`,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: successFlag,
          });
        },
      });

      await page.locator('#url').fill('/callback/test/123');
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      await expect(page.getByText(successFlag)).toBeVisible();

      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(2);

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Differentiate between two methods on same wildcard URL', async ({
      page,
      intercept,
    }) => {
      const wildcardUrl = `${hostnamePrefix}/callback/*/*`;
      const actualUrl = `${hostnamePrefix}/callback/test/123`;

      const requestFlag = { message: 'test' };

      const getRequest = intercept.get({
        url: wildcardUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'The chess',
          });
        },
      });

      const postRequest = intercept.post({
        url: wildcardUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'Speaks for itself',
          });
        },
      });

      await page.locator('#url').fill(actualUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      await expect(page.getByText('The chess')).toBeVisible();

      await page.locator('#method').selectOption('POST');
      await page.locator('#body').fill(JSON.stringify(requestFlag));
      await page.locator('#submit').click();
      await postRequest.wait();

      expect(postRequest.requests[0].postDataJSON()).toEqual(requestFlag);
      await expect(page.getByText('Speaks for itself')).toBeVisible();

      await page.locator('#submit').click();
      await postRequest.wait();

      expect(postRequest.requests).toHaveLength(2);

      await expect(postRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test("Don't match wildcard URLs if source URL doesn't meet segment criteria", async ({
      page,
      intercept,
    }) => {
      const wildcardUrl = `${hostnamePrefix}/callback/*/*/*/*`;
      const actualUrl = `${hostnamePrefix}/callback/test/123/456`;

      const getRequest = intercept.get({
        url: wildcardUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'The chess',
          });
        },
      });

      await page.locator('#url').fill(actualUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();

      expect(getRequest.requests).toHaveLength(0);
    });
  }
});
