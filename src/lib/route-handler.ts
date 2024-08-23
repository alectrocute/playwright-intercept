import type { Route, Page, Request } from '@playwright/test';
import type { InterceptSetup } from '../types/intercept-setup';
import { MatchResult } from 'path-to-regexp';
import { getMimeType } from './get-mime-type';
import { MimeTypes } from '../types/mime-types';
import { GlobalOptions } from '../types/options/global';
import { normalizeBody } from './normalize-body';
import { nextTick } from 'vue';
import path from 'path';
import fs from 'fs';

/**
 * This function is a MITM route handler. Every request on a page is
 * intercepted and passed here to be handled. Any request that matches
 * an existing intercept is handled according to config. Any request
 * that does not match an existing intercept is allowed to continue.
 */

interface RouteHandlerParams {
  globalOptions?: GlobalOptions;
  intercepts: InterceptSetup[];
  page: Page;
  route: Route;
  unhandledRequests: Request[];
}

export async function routeHandler({
  globalOptions,
  intercepts,
  page,
  route,
  unhandledRequests,
}: RouteHandlerParams) {
  const intercept = intercepts.find(
    (intercept) =>
      intercept.match(route.request().url()) &&
      intercept.method === route.request().method()
  );

  // Collect and pass-through all unhandled requests.
  if (!intercept) {
    unhandledRequests.push(route.request());
    return route.continue().catch(() => {});
  }

  // Ensure the response has been downloaded by client and then
  // as an anti-flake measure, push the request upon next tick.
  page.once('requestfinished', () => {
    nextTick(() => intercept.requests.push(route.request()));
  });

  const { params } = intercept.match(route.request().url()) as MatchResult;

  if ('delay' in intercept) {
    await new Promise((resolve) => {
      setTimeout(resolve, intercept.delay);
    });
  }

  if ('body' in intercept || 'fixture' in intercept) {
    let body = '';
    let mimeType: MimeTypes = MimeTypes.JSON;

    if ('body' in intercept) {
      body = normalizeBody(intercept.body);
      mimeType = getMimeType({ body });
    }

    if ('fixture' in intercept) {
      const fixturePath = path.join(
        globalOptions?.fixturePathPrefix ?? '',
        typeof intercept.fixture === 'function'
          ? intercept.fixture({
              route,
              params: params as Record<string, string>,
            })
          : intercept.fixture
      );

      try {
        body = await fs.promises.readFile(fixturePath, 'utf8');
      } catch {
        console.error(
          `Fixture read error: ${fixturePath} does not exist or cannot be read.`
        );
      }

      mimeType = getMimeType({ path: fixturePath });
    }

    const isJSONBody = mimeType === MimeTypes.JSON;

    if (isJSONBody) {
      body = JSON.parse(body);
    }

    if (intercept.modifier) {
      body = intercept.modifier({
        body,
        params: params as Record<string, string>,
        request: route.request(),
      });
    }

    return route.fulfill(
      Object.defineProperty(
        {
          contentType: intercept.mimeType ?? mimeType,
          status: intercept.statusCode ?? 200,
        },
        isJSONBody ? 'json' : 'body',
        { value: body }
      )
    );
  }

  if ('handler' in intercept) {
    return intercept.handler({
      route,
      params: params as Record<string, string>,
      request: route.request(),
    });
  }

  if ('statusCode' in intercept) {
    return route.fulfill({
      status: intercept.statusCode,
    });
  }
}
