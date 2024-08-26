import type { WebsocketHandlerArgs } from "./intercept";

export interface WebsocketOptions {
  url: string;
  handler: (args: WebsocketHandlerArgs) => void;
}
