import { InterceptSetup } from '../types/intercept-setup';
import { UpdateOptions } from '../types/options/update';

/**
 * Allows you to update the options of an intercept post-initialization.
 *
 * @param {InterceptSetup} interceptSetup
 * @param {UpdateOptions} options
 * @returns {void}
 */

export function update(
  interceptSetup: InterceptSetup,
  options: UpdateOptions
): void {
  Object.assign(
    interceptSetup,
    typeof options === 'function' ? options(interceptSetup) : options
  );
}
