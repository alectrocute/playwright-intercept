# playwright-intercept

This fixture extension provides a Cypress-influenced API (like [`cy.intercept`](https://docs.cypress.io/api/commands/intercept)) for mocking and intercepting network requests in Playwright.

### Features

- Mock and intercept `POST`, `GET`, `PUT`, `PATCH` and `DELETE` responses
- Craft dynamic responses at runtime using data from request params & bodies
- Assert that requests were made to a specific URL
- Assert the content of request bodies
- Wait for a request to be made before continuing
- Support for named route params (eg. `/api/:apiVersion/callback/:id`)
- Strongly typed in TypeScript
- Test coverage

### Installation

```bash
npm i playwright-intercept --save-dev
```

### Setup

Simply extend your `base` test fixture with the `Intercept` class, providing optional global configuration options:

- `fixturePathPrefix` is the path to your mock data folder, eg. a folder of JSON files containing default response bodies
- To avoid Playwright log spam, `staticExtensions` are extensions of files that should never be intercepted

```typescript
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

```typescript
test("Can submit form", async ({ page, intercept }) => {
  // first, set up the intercept, for example:
  const apiFormCallback = intercept.post({
    url: "/api/form/:id",
    statusCode: 200,
    body: {
      status: "success",
    },
    // or you could pass a file:
    // fixture: "path/to/response-body.json",
    // and even modify the response body at runtime:
    // modifier: ({ body, params }) => {
    //   if (params.id === "foo") {
    //     body.status = "bar";
    //   }
    //   return body;
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

We recommend you create fixtures of `Intercept` instances, logically grouped together. To see this pattern demonstrated, check out [`collection-example.spec.ts`](https://github.com/alectrocute/playwright-intercept/blob/main/tests/collection-example.spec.ts) in this repo.

We understand that everybody has their own preferred implementation pattern, so if you've found another great way to structure your `Intercept` instances in your Playwright codebase, please let us know in a PR or Issue!

## API

### `intercept[.get, .post, .patch, .put, .delete]`

```typescript
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

### `<InterceptSurface>.wait({ timeout?: number })`

Resolves promise if requests have been made to the URL via selected method.

### `<InterceptSurface>.requests`

Gives you direct access to all requests made to the URL.

### `<InterceptSurface>.update(InterceptOptions | (InterceptOptions) => InterceptOptions)`

Allows you to change the options of an intercept post-initialization for the lifetime of the test spec.
