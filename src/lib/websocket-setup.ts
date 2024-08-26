import type { Page } from '@playwright/test';
import type { WebsocketOptions } from '../types/options/websocket';
import type { InterceptWebsocketSurface } from '../types/intercept-websocket-surface';
import WebSocket, { WebSocketServer } from 'ws';
import portfinder from 'portfinder';
import type { InterceptSetup } from '../types/intercept-setup';
import { reactive, ref } from 'vue';
import { wait } from './wait';
import type { WaitOptions } from '../types/options/wait';

export async function websocketSetup(page: Page, options: WebsocketOptions): Promise<InterceptWebsocketSurface> {
  const interceptSetup = <InterceptSetup>{
    wssPayloads: reactive([]),
    previousRequestCount: ref(0),
    method: 'WSS',
    ...options,
  };

  const port = await portfinder.getPortPromise();

  const localWssUrl = `ws://localhost:${port}`;

  // @todo: ...ugh
  await page.route("**", async (route) => {
    try {
      const response = await route.fetch();
      const pageHtml = await response.text();

      if (!pageHtml.includes(options.url)) {
        route.continue();
        return;
      }

      const body = pageHtml.replaceAll(options.url, localWssUrl);
      const headers = response.headers();
      const csp = headers['content-security-policy'];
      headers['content-security-policy'] = csp?.replace(
        "connect-src 'self'",
        "connect-src 'self' localhost:* ws://localhost:*"
      );

      await route.fulfill({ response, body, headers });
    } catch (e) {
      try {
        route?.continue();
      } catch {
        //
      }
    }
  });

  const wss = new WebSocketServer({ port });

  let send: (message: string) => void;

  wss.on('connection', (ws: WebSocket) => {
    send = ws.send.bind(ws);

    const handshakeMessage = 'intercept:handshake';
    interceptSetup.wssPayloads?.push(handshakeMessage);
    options.handler({ message: handshakeMessage, send });

    ws.on('message', (data) => {
      interceptSetup.wssPayloads?.push(data.toString());
      options.handler({ message: data.toString(), send });
    });
  });

  return {
    wait: (waitOptions?: WaitOptions) => wait(interceptSetup, waitOptions),
    send: (message: string) => send(message),
    wssPayloads: interceptSetup.wssPayloads!,
  }
}