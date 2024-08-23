import { InterceptSetup } from '../intercept-setup';

/**
 * The configuration object for updating an intercept.
 *
 * @note: I tried to avoid the `any` type here, but there's - what I think
 * is - a bug in the TypeScript compiler that prevents me from doing so.
 *
 * Error is: "Property 'body' does not exist on type 'InterceptSetup'",
 * thrown when trying to access `intercept.body` in the `update` function.
 */
export type UpdateOptions =
  | Partial<InterceptSetup>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((intercept: any) => InterceptSetup);
