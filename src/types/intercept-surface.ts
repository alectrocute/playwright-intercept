import type { Request } from '@playwright/test';
import type { WaitOptions } from './options/wait';
import type { UpdateOptions } from './options/update';

/**
 * User-facing intercept return type.
 */

export interface InterceptSurface<T extends Buffer | object | string>{
  requests: Request[];
  wait: (options?: WaitOptions) => Promise<void>;
  update: (options: UpdateOptions<T>) => void;
}
