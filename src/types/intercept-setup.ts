import type { InterceptOptions } from './options/intercept';
import type { Request } from '@playwright/test';
import type { MatchFunction } from 'path-to-regexp';
import type { Ref } from 'vue';

/**
 * The full internal model of an intercept.
 */

export type InterceptSetup = InterceptOptions & {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'WSS';
  match?: MatchFunction;
  requests?: Request[];
  wssPayloads?: string[];
  previousRequestCount: Ref<number>;
};
