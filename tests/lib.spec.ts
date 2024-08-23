import { test, expect } from '@playwright/test';
import { createMatchFunction, getMimeType, normalizeBody } from '../dist';

test.describe('Lib Functions', () => {
  test.describe('Route Matching', () => {
    test('Wildcard usage', () => {
      let matchFn = createMatchFunction('https://example.com/callback/*/*');

      expect(matchFn('https://example.com/callback/test/123')).toBeTruthy();
      expect(matchFn('https://example.com/not-callback/test/123')).toBe(false);
      expect(matchFn('https://example.com/callback/test')).toBe(false);
      expect(matchFn('https://example.com/callback')).toBe(false);

      matchFn = createMatchFunction('/callback/*/*');

      expect(matchFn('https://example.com/callback/test/123')).toBeTruthy();
      expect(matchFn('https://example.com/not-callback/test/123')).toBe(false);
      expect(matchFn('https://example.com/callback/test')).toBe(false);
      expect(matchFn('https://example.com/callback')).toBe(false);
    });

    test('Named param usage', () => {
      let matchFn = createMatchFunction('/callback/:id/foo/:name');

      expect(matchFn('https://example.com/callback/test/foo/123')).toEqual({
        index: 0,
        path: '/callback/test/foo/123',
        params: {
          id: 'test',
          name: '123',
        },
      });

      matchFn = createMatchFunction(
        'https://example.com/callback/:id/foo/:name'
      );

      expect(matchFn('https://example.com/callback/test/foo/123')).toEqual({
        index: 0,
        path: '/callback/test/foo/123',
        params: {
          id: 'test',
          name: '123',
        },
      });

      expect(matchFn('https://example.com/callback')).toBeFalsy();
    });

    test('Mixed named param and wildcard usage', () => {
      let matchFn = createMatchFunction('/*/:id/foo/:name');

      expect(matchFn('https://example.com/callback/test/foo/123')).toEqual({
        index: 0,
        path: '/callback/test/foo/123',
        params: {
          '0': 'callback',
          id: 'test',
          name: '123',
        },
      });

      matchFn = createMatchFunction('https://example.com/*/:id/foo/:name');

      expect(matchFn('https://example.com/callback/test/foo/123')).toEqual({
        index: 0,
        path: '/callback/test/foo/123',
        params: {
          '0': 'callback',
          id: 'test',
          name: '123',
        },
      });

      expect(matchFn('https://example.com/callback')).toBeFalsy();
      expect(matchFn('https://example.com/callback/1')).toBeFalsy();
    });

    test('Wildcard query param usage', () => {
      let matchFn = createMatchFunction('*/service/settings/users/me?uid=*');
      const actualUrl =
        'http://example.com/service/settings/users/me?uid=123';

      expect(matchFn(actualUrl)).toEqual({
        index: 0,
        path: '/service/settings/users/me',
        params: {},
      });

      matchFn = createMatchFunction('*/service/settings/users/me?*');

      expect(matchFn(actualUrl)).toEqual({
        index: 0,
        path: '/service/settings/users/me',
        params: {},
      });

      matchFn = createMatchFunction('*/service/settings/users/me*');

      expect(matchFn(actualUrl)).toEqual({
        index: 0,
        path: '/service/settings/users/me',
        params: {
          '0': '',
        },
      });
    });
  });

  test.describe('Mime Types', () => {
    test.describe('Detect Mime Types From Body', () => {
      function runTest(str: string, buffer: Buffer, expected: string) {
        expect(getMimeType({ body: str })).toBe(expected);
        expect(getMimeType({ body: buffer.toString() })).toBe(expected);
      }

      test('HTML', () => {
        const str = '<html><body></body></html>';
        const buffer = Buffer.from(str);
        runTest(str, buffer, 'text/html');
      });

      test('CSS', () => {
        const str = `
      :root {
        --color: red;
      }

      .test {
        display: flex;
      }
      `;

        const buffer = Buffer.from(str);

        runTest(str, buffer, 'text/css');
      });

      test('JSON', () => {
        const str = `
      [
        {
          "test": 1
        }
      ]
      `;

        const buffer = Buffer.from(str);

        runTest(str, buffer, 'application/json');
      });

      test('JS', () => {
        const str = `
      document.addEventListener("DOMContentLoaded", function (event) {
          document
            .getElementById("submit")
            .addEventListener("mousedown", () => alert('hi'));
        });
      `;

        const buffer = Buffer.from(str);

        runTest(str, buffer, 'text/javascript');
      });

      test('Text', () => {
        const str = `Text response from server for some reason`;

        const buffer = Buffer.from(str);

        runTest(str, buffer, 'text/plain');
      });
    });

    test.describe('Detect Mime Types From Fixture Path', () => {
      function runTest(path: string, expected: string) {
        expect(getMimeType({ path })).toBe(expected);
      }

      test('HTML', () => {
        runTest('index.html', 'text/html');
      });

      test('CSS', () => {
        runTest('style.css', 'text/css');
      });

      test('JSON', () => {
        runTest('example-fixture.json', 'application/json');
      });

      test('JS', () => {
        runTest('script.js', 'text/javascript');
      });

      test('Text', () => {
        runTest('response.txt', 'text/plain');
      });
    });
  });

  test.describe('Normalize Bodies', () => {
    function runTest(body: Buffer | string | object, expected: string) {
      expect(normalizeBody(body)).toBe(expected);
    }

    test('Buffer', () => {
      runTest(Buffer.from('test'), 'test');
    });

    test('String', () => {
      runTest('test', 'test');
    });

    test('Object', () => {
      runTest({ test: 1 }, '{"test":1}');
    });
  });
});
