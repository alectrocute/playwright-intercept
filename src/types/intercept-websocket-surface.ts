import type { WaitOptions } from './options/wait';

export interface InterceptWebsocketSurface {
  wait: (options?: WaitOptions | undefined) => Promise<void>;
  send: (message: string) => void;
  wssPayloads: string[];
}
