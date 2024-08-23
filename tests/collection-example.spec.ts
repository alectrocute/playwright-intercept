import { Intercept, InterceptSurface } from "../dist";
import * as base from "@playwright/test";
import path from "path";

type FixtureStructure = Record<string, InterceptSurface>;
type InterceptFixture = Intercept;

export async function intercept({ page }, use) {
    const intercept = new Intercept(page, {
        fixturePathPrefix: path.join(process.cwd(), "tests"),
    });

    const mockAppGet = intercept.get({
        url: 'https://example.com',
        fixture: 'mock-app/index.html',
    });

    await page.goto('https://example.com');

    await mockAppGet.wait();

    await use(intercept);
}

const createInterceptFixture =
    <T extends FixtureStructure>(setupMocks: (intercept: Intercept) => T) =>
        async ({ intercept }, use) => {
            const fixture = setupMocks(intercept);
            await use(fixture);
        };

function mockEndpoints(intercept: Intercept) {
    return {
        getAllItems: intercept.get({
            url: "/get-all-items",
            statusCode: 200,
        }),
        createItem: intercept.post({
            url: "/create-item",
            statusCode: 200,
        }),
    }
}

type Fixtures = {
    intercept: InterceptFixture;
    mockEndpoints: ReturnType<typeof mockEndpoints>;
}

const fixtures = {
    intercept,
    mockEndpoints: createInterceptFixture(mockEndpoints),
};

const test = base.test.extend<Fixtures>(fixtures);

test('Example using collection of intercepts', async ({ page, mockEndpoints }) => {
    await page.locator('#url').fill("/get-all-items");
    await page.locator('#method').selectOption('GET');
    await page.locator('#submit').click();

    await mockEndpoints.getAllItems.wait();

    await page.locator('#url').fill("/create-item");
    await page.locator('#method').selectOption('POST');
    await page.locator('#submit').click();

    await mockEndpoints.createItem.wait();
});
