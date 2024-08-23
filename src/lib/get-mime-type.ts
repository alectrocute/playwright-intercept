import { MimeTypes } from '../types/mime-types';
import { parseScript } from 'esprima';
import mime from 'mime-types';

/**
 * This function is used to detect mime type
 * from file path or arbitrary body string.
 *
 * @param {GetMimeTypeOptions} options
 * @returns {MimeTypes}
 */

type GetMimeTypeOptions =
  | {
      body: string;
    }
  | {
      path: string;
    };

export function getMimeType(options: GetMimeTypeOptions): MimeTypes {
  if ('path' in options) {
    const mimeType = mime.lookup(options.path);

    // "application/javascript" is obsolete,
    // but still used by the mime-types package
    if (mimeType === 'application/javascript') {
      return MimeTypes.JS;
    }

    if (mimeType) {
      return mimeType as MimeTypes;
    }
  }

  if ('body' in options) {
    try {
      JSON.parse(options.body);
      return MimeTypes.JSON;
    } catch (e) {
      //
    }

    if (
      ['<html>', '<!doctype html>'].some((flag) =>
        options.body.toLowerCase().startsWith(flag)
      )
    ) {
      return MimeTypes.HTML;
    }

    if (
      /((?:^\s*)([\w#.@*,:\-.:>,*\s]+)\s*{(?:[\s]*)((?:[A-Za-z\- \s]+[:]\s*['"0-9\w .,/()\-!%]+;?)*)*\s*}(?:\s*))/.test(
        options.body
      )
    ) {
      return MimeTypes.CSS;
    }

    try {
      parseScript(options.body);
      return MimeTypes.JS;
    } catch (e) {
      //
    }

    return MimeTypes.TEXT;
  }

  return MimeTypes.JSON;
}
