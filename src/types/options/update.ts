import { InterceptSetup } from '../intercept-setup';

/**
 * The configuration object for updating an intercept.
 *
 * @note: PR is welcome to remove the `any` type here.
 */
export type UpdateOptions =
  | Partial<InterceptSetup>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((intercept: any) => InterceptSetup);
