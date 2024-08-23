import type { Route, Request } from '@playwright/test';

/**
 * The configuration object for an intercept.
 */

type BaseOptions = {
  url: string;
  statusCode?: number;
  delay?: number;
};

type MimeTypeOption = {
  mimeType?: string;
};

type ModifierOption = {
  modifier?: <T extends Buffer | object | string>(args: {
    body: T;
    params: Record<string, string>;
    request: Request;
  }) => T;
};

type BodyOption<T extends Buffer | object | string> = {
  body: T;
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

export type InterceptOptions<T extends Buffer | object | string> = BaseOptions &
  (
    | (MimeTypeOption & ModifierOption & (BodyOption<T> | FixtureOption))
    | HandlerOption
    | { statusCode: number }
  );
