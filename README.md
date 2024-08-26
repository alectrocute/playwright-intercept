# playwright-intercept 🎭

This fixture extension provides a Cypress-influenced API (like [`cy.intercept`](https://docs.cypress.io/api/commands/intercept)) for mocking and intercepting network requests in Playwright.

### Features

- Mock and intercept `GET`, `POST`, `PUT`, `PATCH` and `DELETE` responses
- Craft dynamic responses at runtime using data from request params & bodies
- Assert that requests were made to a specific URL
- Assert the content of request bodies
- Wait for a request to be made before continuing
- Support for named route params (eg. `/api/:apiVersion/callback/:id`)
- Strongly typed in TypeScript
- Test coverage

### Installation ([npm](https://www.npmjs.com/package/playwright-intercept))

```bash
npm i playwright-intercept --save-dev
```

### Setup

Simply extend your `base` test fixture with the `Intercept` class, providing optional global configuration options:

- `fixturePathPrefix` is the path to your mock data folder, eg. a folder of JSON files containing default response bodies
- To avoid Playwright log spam, `staticExtensions` are extensions of files that should never be intercepted

```ts
import * as base from "@playwright/test";
import { Intercept } from "playwright-intercept";

const test = base.extend<BaseFixtures>({
  intercept: async ({ page }, use) => {
    await use(
      new Intercept(page, {
        fixturePathPrefix: path.join(process.cwd(), "tests"),
        staticExtensions: ['js', 'css', 'png', 'jpg', 'svg'],
      })
    );
  },
});
```

### Basic Usage

```ts
test("Can submit form", async ({ page, intercept }) => {
  // first, set up the intercept, for example:
  const apiFormCallback = intercept.post({
    url: "/api/form/:id",
    statusCode: 200,
    body: {
      status: "success",
    },
    // you can also pass a file for the response body:
    // fixture: "path/to/response-body.json",
    //
    // and modify it on the fly:
    // modifier: ({ body, params }) => {
    //   if (params.id === "foo") {
    //     body.status = "bar";
    //   }
    //   return body;
    // },
    //
    // or pass a handler function for more advanced use cases:
    // handler: ({ route, request, params }) => {
    //   // `route` and `request` are both normal Playwright objects
    //   return route.fulfill({
    //     status: 200,
    //     contentType: 'application/json',
    //     body: `That named route param was ${params.id}`,
    //   });
    // },
  });

  await page.goto("/my-form");

  await page.fill('input[name="name"]', "Bar");

  await page.locator("#submit-button").click();

  await apiFormCallback.wait();

  await expect(apiFormCallback.requests[0].postDataJSON()).toBe({
    name: "Bar",
  });

  apiFormCallback.update({
    statusCode: 400,
    body: {
      status: "fail",
    }
  });

  await page.locator("#submit-button").click();

  await apiFormCallback.wait();

  await page.waitForSelector('div[role="alert"]');
});
```

> [!TIP]  
> This repo's [`tests`](https://github.com/alectrocute/playwright-intercept/tree/main/tests) folder contains examples that demonstrate the setup and functionality of playwright-intercept.

### Suggested Implementation Pattern

We recommend you create fixtures of `Intercept` instances, logically grouped together. To see this pattern demonstrated, check out [`collection-of-intercepts-as-fixture.spec.ts`](https://github.com/alectrocute/playwright-intercept/blob/main/tests/examples/collection-of-intercepts-as-fixture.spec.ts) in this repo.

We understand that everybody has their own preferred implementation pattern, so if you've found another great way to structure your `Intercept` instances in your Playwright codebase, please let us know in a PR or Issue!

## API

### `intercept[.get, .post, .patch, .put, .delete]`

```ts
type BaseOptions = {
  url: string;
  statusCode?: number;
};

type MimeTypeOption = {
  mimeType?: string;
};

type ModifierOption = {
  modifier?: (args: {
    body: any;
    params: Record<string, string>;
    request: Request;
  }) => any;
};

type BodyOption = {
  body: Buffer | object | string;
};

type FixtureOption = {
  fixture:
    | string
    | ((args: { route: Route; params: Record<string, string> }) => string);
};

type HandlerOption = {
  handler: (args: {
    route: Route;
    params: Record<string, string>;
    request: Request;
  }) => void;
};

export type InterceptOptions = BaseOptions &
  (
    | (MimeTypeOption & ModifierOption & (BodyOption | FixtureOption))
    | HandlerOption
    | { statusCode: number }
  );
```

At test runtime, `InterceptSurface` provides some methods and reactive attributes to help you assert requests.

### `.wait({ timeout?: number })`

Resolves promise if a request has been made to the URL via selected method.

```ts
await myIntercept.wait({ timeout: 1000 });
```

### `.requests`

Gives you direct access to all requests made to the URL.

```ts
expect(myIntercept.requests[0].postData()).toEqual({
  body: "foo"
});

expect(myIntercept.requests).toHaveLength(2);
```

### `.update(InterceptOptions | (InterceptOptions) => InterceptOptions)`

Allows you to change the options of an intercept post-initialization for the lifetime of the test spec.

```ts
myIntercept.update({
  statusCode: 400,
  body: { id: 1 },
});
```

## Contributing

Contributions are welcome! Please open [an issue](https://github.com/alectrocute/playwright-intercept/issues) or [PR](https://github.com/alectrocute/playwright-intercept/pulls) if you have any suggestions or improvements.
