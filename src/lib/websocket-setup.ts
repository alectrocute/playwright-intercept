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
        const frameHtml = await response.text();
        const body = frameHtml.replaceAll(options.url, localWssUrl);
        const headers = response.headers();
        const csp = headers['content-security-policy'];
        headers['content-security-policy'] = csp?.replace(
          "connect-src 'self'",
          "connect-src 'self' localhost:* ws://localhost:*"
        );
        await route.fulfill({ response, body, headers });
      } catch {
        route.continue();
      }
    });

    const wss = new WebSocketServer({ port });

    let send: (message: string) => void;

    wss.on('connection', (ws: WebSocket) => {
      send = ws.send.bind(ws);

      options.handler({ message: 'intercept:handshake', send });

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