/**
 * This function generates a RegExp based
 * upon static extensions, if applicable.
 *
 * @param {GlobalOptions} globalOptions
 * @param {string[]} ignoredUrls
 * @returns {string | RegExp}
 */

import { GlobalOptions } from '../types/options/global';

export function getRouteRegex(
  globalOptions?: GlobalOptions,
  ignoredUrls?: string[]
): string | RegExp {
  const { staticExtensions } = globalOptions ?? { staticExtensions: [] };

  if (staticExtensions?.length && !ignoredUrls?.length) {
    return new RegExp(`^(?!.*[.](${staticExtensions.join('|')})(\\?|$)).*$`);
  }

  if (!staticExtensions?.length && ignoredUrls?.length) {
    return new RegExp(`^(?!.*${ignoredUrls.join('|')}).*.*$`);
  }

  if (staticExtensions?.length && ignoredUrls?.length) {
    return new RegExp(
      `^(?!.*[.](${staticExtensions.join('|')})(\\?|$))(?!.*${ignoredUrls
        ?.join('|')
        .replaceAll('/', '\\/')}).*$`
    );
  }

  return '**';
}
