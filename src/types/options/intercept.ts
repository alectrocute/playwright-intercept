import type { Route, Request } from '@playwright/test';

/**
 * The configuration object for an intercept.
 */

type BaseOptions = {
  url: string;
  statusCode?: number;
};

type MimeTypeOption = {
  mimeType?: string;
};

type ModifierOption = {
  modifier?: (args: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any;
    params: Record<string, string>;
    request: Request;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => any;
};

type BodyOption = {
  body: Buffer | object | string;
};

type FixtureOption = {
  fixture:
    | string
    | ((args: { route: Route; params: Record<string, string> }) => string);
};

type HandlerOption = {
  handler: (args: {
    route: Route;
    params: Record<string, string>;
    request: Request;
  }) => void;
};

export type InterceptOptions = BaseOptions &
  (
    | (MimeTypeOption & ModifierOption & (BodyOption | FixtureOption))
    | HandlerOption
    | { statusCode: number }
  );
