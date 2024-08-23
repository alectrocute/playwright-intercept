import type { InterceptOptions } from './types/options/intercept';
import type { InterceptSurface } from './types/intercept-surface';
import type { InterceptSetup } from './types/intercept-setup';
import type { GlobalOptions } from './types/options/global';
import type { Page, Route, Request } from '@playwright/test';
import { routeHandler } from './lib/route-handler';
import { createMatchFunction } from './lib/create-match-function';
import { getMimeType } from './lib/get-mime-type';
import { normalizeBody } from './lib/normalize-body';
import { reactive, ref } from 'vue';
import type { WaitOptions } from './types/options/wait';
import type { UpdateOptions } from './types/options/update';
import { wait } from './lib/wait';
import { update } from './lib/update';
import { getRouteRegex } from './lib/get-route-regex';

export { createMatchFunction, getMimeType, normalizeBody };

export class Intercept {
  globalOptions?: GlobalOptions;

  intercepts: InterceptSetup[];

  page: Page;

  unhandledRequests: Request[];

  ignoredUrls: string[];

  constructor(page: Page, globalOptions?: GlobalOptions) {
    this.globalOptions = globalOptions;

    this.intercepts = reactive([]);

    this.page = page;

    this.unhandledRequests = reactive([]);

    this.ignoredUrls = reactive([]);

    this.route();
  }

  private async route(): Promise<void> {
    await this.page.route(
      getRouteRegex(this.globalOptions, this.ignoredUrls),
      async (route: Route) =>
        await routeHandler({
          page: this.page,
          route,
          intercepts: this.intercepts,
          unhandledRequests: this.unhandledRequests,
          globalOptions: this.globalOptions,
        })
    );
  }

  private async unroute(): Promise<void> {
    await this.page.unroute(
      getRouteRegex(this.globalOptions, this.ignoredUrls)
    );
  }

  private setup<T extends Buffer | object | string>(
    options: InterceptOptions<T>,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  ): InterceptSurface<T> {
    const interceptSetup: InterceptSetup = {
      method,
      match: createMatchFunction(options.url),
      requests: reactive([]),
      previousRequestCount: ref(0),
      ...options,
    };

    this.intercepts.push(interceptSetup);

    return {
      requests: interceptSetup.requests,
      wait: (waitOptions?: WaitOptions) => wait(interceptSetup, waitOptions),
      update: (updateOptions: UpdateOptions<T>) =>
        update(interceptSetup, updateOptions),
    };
  }

  async addIgnoredUrl(ignoreUrl: string): Promise<void> {
    await this.unroute();

    this.ignoredUrls.push(ignoreUrl);

    await this.route();
  }

  get<T extends Buffer | object | string>(options: InterceptOptions<T>): InterceptSurface<T> {
    return this.setup(options, 'GET');
  }

  post<T extends Buffer | object | string>(options: InterceptOptions<T>): InterceptSurface<T> {
    return this.setup(options, 'POST');
  }

  put<T extends Buffer | object | string>(options: InterceptOptions<T>): InterceptSurface<T> {
    return this.setup(options, 'PUT');
  }

  patch<T extends Buffer | object | string>(options: InterceptOptions<T>): InterceptSurface<T> {
    return this.setup(options, 'PATCH');
  }

  delete<T extends Buffer | object | string>(options: InterceptOptions<T>): InterceptSurface<T> {
    return this.setup(options, 'DELETE');
  }
}

export type { InterceptOptions, InterceptSurface };
