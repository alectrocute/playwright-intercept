import { Intercept } from '../../dist';
import { test as base, expect } from '@playwright/test';

type BaseFixtures = {
    intercept: Intercept;
};

const test = base.extend<BaseFixtures>({
    intercept: async ({ page }, use) => {
        await use(
            new Intercept(page)
        );
    },
});

test.describe('Websockets', () => {
    test('Intercept websockets', async ({ page, intercept }) => {
        const mockWebsocketServer = await intercept.wss({
            url: 'wss://demo.piesocket.com/v3/channel_123?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self',
            handler: ({ message, send }) => {
                if (message === "Hello PieSocket!") {
                    send!("Hi there");
                }

                if (message === "intercept:handshake") {
                    send!("I have intercepted the handshake!");
                }
            }
        });

        await page.goto('https://piehost.com/websocket-tester');

        await page.getByRole('button', { name: 'Connect' }).click();

        await mockWebsocketServer.wait();

        await expect(page.getByText('Connection Established')).toBeVisible();

        await page.getByRole('button', { name: 'Send' }).click();

        await mockWebsocketServer.wait();

        await expect(page.getByText('Hi there')).toBeVisible();

        expect(mockWebsocketServer.wssPayloads?.length).toBe(2);

        expect(mockWebsocketServer.wssPayloads?.[1]).toBe("Hello PieSocket!");
    });
});