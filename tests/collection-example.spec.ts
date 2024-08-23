import { Intercept, InterceptSurface } from "../dist";
import * as base from "@playwright/test";
import path from "path";

// In the real world, you'd want to export `mockItemEndpoints` from a different .ts file
function mockItemEndpoints(intercept: Intercept) {
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

type FixtureStructure = Record<string, InterceptSurface>;
type InterceptFixture = Intercept;

export async function intercept({ page }, use) {
    const intercept = new Intercept(page, {
        fixturePathPrefix: path.join(process.cwd(), "tests"),
    });

    // You could treat this like a global "before each" hook
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

type Fixtures = {
    intercept: InterceptFixture;
    mockItemEndpoints: ReturnType<typeof mockItemEndpoints>;
}

const fixtures = {
    intercept,
    mockItemEndpoints: createInterceptFixture(mockItemEndpoints),
};

// And finally, here's your potential `test` export!
const test = base.test.extend<Fixtures>(fixtures);

// Let's now use it, pulling in the `mockItemEndpoints` fixture.
test('Example using collection of intercepts', async ({ page, mockItemEndpoints }) => {
    await page.locator('#url').fill("/get-all-items");
    await page.locator('#method').selectOption('GET');
    await page.locator('#submit').click();

    // See? You've already got your intercepts set up!
    await mockItemEndpoints.getAllItems.wait();

    await page.locator('#url').fill("/create-item");
    await page.locator('#method').selectOption('POST');
    await page.locator('#submit').click();

    await mockItemEndpoints.createItem.wait();
});
