import { Intercept } from '../../dist';
import { test as base, expect } from '@playwright/test';
import path from 'path';

type BaseFixtures = {
    intercept: Intercept;
};

const test = base.extend<BaseFixtures>({
    intercept: async ({ page }, use) => {
        await use(
            new Intercept(page, {
                fixturePathPrefix: path.join(process.cwd(), 'tests/e2e'),
            })
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
            }
        });

        await page.goto('https://piehost.com/websocket-tester');

        await page.getByRole('button', { name: 'Connect' }).click();

        await expect(page.getByText('Connection Established')).toBeVisible();

        await page.getByRole('button', { name: 'Send' }).click();

        await mockWebsocketServer.wait();

        await expect(page.getByText('Hi there')).toBeVisible();

        expect(mockWebsocketServer.wssPayloads?.length).toBe(1);
    });
});