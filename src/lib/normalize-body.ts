/**
 * This function is a helper used to normalize
 * anything passed as a "body" in an intercept.
 *
 * @param {string | object | Buffer} body
 * @returns {string}
 */

export function normalizeBody(body: string | object | Buffer): string {
  return Buffer.isBuffer(body)
    ? body.toString()
    : typeof body === 'object'
      ? JSON.stringify(body)
      : (body as string);
}
