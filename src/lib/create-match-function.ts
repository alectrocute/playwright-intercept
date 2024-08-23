import { MatchFunction, match } from 'path-to-regexp';

/**
 * This function is used to generate a "match function" from a rule.
 *
 * A "match function" is a single-argument function that recieves a URL,
 * returning false if the URL does not match the function's "rule", or a
 * "MatchResult" object (which contains parsed params) if it does match.
 * These are used not only to match routes but also to parse route params.
 *
 * @param {string} rule
 * @returns {MatchFunction}
 */

export function createMatchFunction(rule: string): MatchFunction {
  return (path: string) => {
    let urlSafeRule;
    let shouldCompareHostnames = true;

    try {
      urlSafeRule = new URL(rule);
    } catch (e) {
      urlSafeRule = new URL(`http://localhost${rule}`);
      shouldCompareHostnames = false;
    }

    if (
      shouldCompareHostnames &&
      new URL(rule).hostname !== new URL(path).hostname
    ) {
      return false;
    }

    const sourcePath = new URL(urlSafeRule).pathname;
    const targetPath = new URL(path).pathname;

    let matchFn: MatchFunction;

    try {
      matchFn = match(sourcePath.replaceAll('*', '(.*)'), {
        decode: decodeURIComponent,
      });
    } catch (e) {
      matchFn = (path: string) => {
        if (path === sourcePath) {
          return {
            index: 0,
            path,
            params: {},
          };
        } else {
          return false;
        }
      };
    }

    return matchFn(targetPath);
  };
}
