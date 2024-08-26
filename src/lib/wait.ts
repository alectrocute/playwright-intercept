import { InterceptSetup } from '../types/intercept-setup';
import { WaitOptions } from '../types/options/wait';
import { expect } from '@playwright/test';

/**
 * @param {InterceptSetup} intercept
 * @param {WaitOptions?} options
 * @returns {void}
 */

export function wait(
  intercept: InterceptSetup,
  options?: WaitOptions
): Promise<void> {
  return expect
    .poll(
      () => {
        const requests = intercept.wssPayloads ?? intercept.requests;
  
        const hasFirstRequest = Boolean(
          intercept.previousRequestCount.value === 0 &&
            requests!.length > 0
        );

        const hasNewRequests = Boolean(
          intercept.previousRequestCount.value > 0 &&
            intercept.previousRequestCount.value < requests!.length
        );

        const shouldPass = Boolean(hasFirstRequest || hasNewRequests);

        if (shouldPass) {
          intercept.previousRequestCount.value = requests!.length;
          return true;
        }

        return false;
      },
      {
        message: `Wait timeout: ${intercept.method} ${intercept.url} should have received a request.`,
        timeout: options?.timeout ?? 5000,
      }
    )
    .toBe(true);
}
