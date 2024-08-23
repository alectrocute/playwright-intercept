import { InterceptSetup } from '../types/intercept-setup';
import { WaitOptions } from '../types/options/wait';

/**
 * A very important functionality of this library, this
 * function is used to intelligently poll for requests.
 *
 * @param {InterceptSetup} intercept
 * @param {WaitOptions?} options
 * @returns {void}
 */

export function wait(
  intercept: InterceptSetup,
  options?: WaitOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    function checkCallback() {
      const hasFirstRequest =
        intercept.previousRequestCount.value === 0 &&
        intercept.requests.length > 0;

      const hasNewRequests = Boolean(
        intercept.previousRequestCount.value > 0 &&
          intercept.previousRequestCount.value < intercept.requests.length
      );

      if (hasFirstRequest || hasNewRequests) {
        intercept.previousRequestCount.value = intercept.requests.length;

        clearInterval(checkInterval);
        clearTimeout(rejectTimeout);
        resolve();
      }
    }

    function rejectCallback() {
      clearInterval(checkInterval);

      reject(
        new Error(
          `Wait timeout: ${intercept.method} ${intercept.url} did not receive any requests.`
        )
      );
    }

    const checkInterval = setInterval(checkCallback, 10);
    const rejectTimeout = setTimeout(rejectCallback, options?.timeout || 5000);

    checkCallback();
  });
}
