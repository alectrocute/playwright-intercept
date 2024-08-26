import { test, expect } from './base';
import path from 'path';
import fs from 'fs';

test.describe('Simple Usage', () => {
  test.describe('With hostname', () => {
    runTests('https://example.com');
  });

  test.describe('Without hostname', () => {
    runTests();
  });

  function runTests(hostnamePrefix = '') {
    test('Basic GET with custom handler', async ({ page, intercept }) => {
      const getRequestUrl = `${hostnamePrefix}/callback/get`;
      const successFlag = 'Speaks for itself';

      const getRequest = intercept.get({
        url: getRequestUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: successFlag,
          });
        },
      });

      await page.locator('#url').fill(getRequestUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText(successFlag)).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with body buffer', async ({ page, intercept }) => {
      const getRequestUrl = `${hostnamePrefix}/callback`;

      const getRequest = intercept.get({
        url: getRequestUrl,
        body: fs.readFileSync(path.join(__dirname, './example-fixture.json')),
      });

      await page.locator('#url').fill(getRequestUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":0}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with body object', async ({ page, intercept }) => {
      const getRequestUrl = `${hostnamePrefix}/callback`;

      const getRequest = intercept.get({
        url: getRequestUrl,
        body: {
          id: 0,
        },
      });

      await page.locator('#url').fill(getRequestUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":0}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with modified body object', async ({ page, intercept }) => {
      const getRequestUrl = `${hostnamePrefix}/callback`;

      const getRequest = intercept.get({
        url: getRequestUrl,
        body: {
          id: 1,
        },
        modifier: ({ body }) => {
          body.id = 0;
          return body;
        },
      });

      await page.locator('#url').fill(getRequestUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":0}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with body string', async ({ page, intercept }) => {
      const getRequestUrl = `${hostnamePrefix}/callback`;

      const getRequest = intercept.get({
        url: getRequestUrl,
        body: JSON.stringify({
          id: 0,
        }),
      });

      await page.locator('#url').fill(getRequestUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":0}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with modified body string', async ({ page, intercept }) => {
      const getRequestUrl = `${hostnamePrefix}/callback`;

      const getRequest = intercept.get({
        url: getRequestUrl,
        body: JSON.stringify({
          id: 1,
        }),
        modifier: ({ body }) => {
          body.id = 0;
          return body;
        },
      });

      await page.locator('#url').fill(getRequestUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":0}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with JSON fixture path', async ({ page, intercept }) => {
      const getRequest = intercept.get({
        url: 'https://example.com/callback',
        fixture: 'example-fixture.json',
      });

      await page.locator('#url').fill('https://example.com/callback');
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":0}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic GET with named params and modified JSON fixture path', async ({
      page,
      intercept,
    }) => {
      const getRequest = intercept.get({
        url: `${hostnamePrefix}/callback/:example`,
        fixture: 'example-fixture.json',
        modifier: ({ body, params }) => {
          const { example } = params;
          body.id = example;
          return body;
        },
      });

      await page.locator('#url').fill(`${hostnamePrefix}/callback/flag`);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('{"id":"flag"}')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Basic POST request with custom handler', async ({
      page,
      intercept,
    }) => {
      const postRequestUrl = `${hostnamePrefix}/callback/post`;
      const requestFlag = '{ "message": "test" }';
      const responseFlag = JSON.stringify({
        message: 'Speaks for itself',
      });

      const postRequest = intercept.post({
        url: postRequestUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: responseFlag,
          });
        },
      });

      await page.locator('#url').fill(postRequestUrl);
      await page.locator('#body').fill(requestFlag);
      await page.locator('#method').selectOption('POST');
      await page.locator('#submit').click();
      await postRequest.wait();

      expect(postRequest.requests[0].postData()).toEqual(requestFlag);
      await expect(page.getByText(responseFlag)).toBeVisible();

      await expect(postRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Handle two intercepts on same URL with different methods', async ({
      page,
      intercept,
    }) => {
      const multiMethodUrl = `${hostnamePrefix}/callback/test`;

      const requestFlag = { message: 'test' };

      const getRequest = intercept.get({
        url: multiMethodUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'The chess',
          });
        },
      });

      const postRequest = intercept.post({
        url: multiMethodUrl,
        handler: ({ route }) => {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'Speaks for itself',
          });
        },
      });

      await page.locator('#url').fill(multiMethodUrl);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();
      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);
      await expect(page.getByText('The chess')).toBeVisible();

      await page.locator('#method').selectOption('POST');
      await page.locator('#body').fill(JSON.stringify(requestFlag));
      await page.locator('#submit').click();
      await postRequest.wait();

      expect(postRequest.requests).toHaveLength(1);
      expect(postRequest.requests[0].postDataJSON()).toEqual(requestFlag);
      await expect(page.getByText('Speaks for itself')).toBeVisible();

      await expect(getRequest.wait({ timeout: 200 })).rejects.toThrow();
      await expect(postRequest.wait({ timeout: 200 })).rejects.toThrow();
    });

    test('Modify a body and statusCode after intercept has been initialized', async ({
      page,
      intercept,
    }) => {
      const url = `${hostnamePrefix}/callback/test`;

      const getRequest = intercept.get({
        url,
        statusCode: 200,
        body: { id: 0 },
      });

      await page.locator('#url').fill(url);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();

      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);

      await expect(page.getByText(JSON.stringify({ id: 0 }))).toBeVisible();

      expect((await getRequest.requests[0].response())?.status()).toEqual(200);

      getRequest.update({
        statusCode: 400,
        body: { id: 1 },
      });

      await page.locator('#submit').click();

      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(2);

      await expect(page.getByText(JSON.stringify({ id: 1 }))).toBeVisible();

      expect((await getRequest.requests[1].response())?.status()).toEqual(400);

      getRequest.update((options) => {
        options.body.id = 'updated!';
        return options;
      });

      await page.locator('#submit').click();

      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(3);

      await expect(
        page.getByText(JSON.stringify({ id: 'updated!' }))
      ).toBeVisible();
    });

    test('Construct a fixture path dynamically', async ({
      page,
      intercept,
    }) => {
      const getRequest = intercept.get({
        url: `${hostnamePrefix}/callback/:id`,
        statusCode: 200,
        fixture({ params }) {
          return `example-fixture-${params.id}.json`;
        },
      });

      await page.locator('#url').fill(`${hostnamePrefix}/callback/1`);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();

      await getRequest.wait();

      expect(getRequest.requests).toHaveLength(1);

      await expect(page.getByText(JSON.stringify({ id: 1 }))).toBeVisible();
    });

    test('Collect and access global unhandled requests', async ({
      page,
      intercept,
    }) => {
      const getRequest = intercept.get({
        url: `${hostnamePrefix}/callback`,
        statusCode: 200,
      });

      await page.locator('#url').fill(`${hostnamePrefix}/callback`);
      await page.locator('#method').selectOption('GET');
      await page.locator('#submit').click();

      await getRequest.wait();

      await page.locator('#url').fill(`${hostnamePrefix}/unhandled/1`);
      await page.locator('#submit').click();

      await page.locator('#url').fill(`${hostnamePrefix}/unhandled/2`);
      await page.locator('#submit').click();

      await getRequest.wait();

      expect(intercept.unhandledRequests).toHaveLength(2);

      expect(intercept.unhandledRequests[0].url()).toBe(
        'https://example.com/unhandled/1'
      );

      expect(intercept.unhandledRequests[1].url()).toBe(
        'https://example.com/unhandled/2'
      );
    });
  }
});
