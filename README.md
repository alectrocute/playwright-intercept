# playwright-intercept

This fixture extension provides a Cypress-influenced API (like `cy.intercept`) for intercepting network requests in Playwright.

### Features

- Strongly typed in TypeScript
- Full E2E test coverage (wouldn't it be ironic if this weren't the case)
- Intercept `POST`, `GET`, `PUT`, `PATCH` and `DELETE` responses
- Modify response bodies at runtime with using data from request params/bodies
- Support for Express-like route params
- Assert that a request was made/not made to a specific URL
- Assert number of requests made to a specific URL
- Wait for requests to be made to a specific URL

### Installation

```bash
npm i playwright-intercept --save-dev
```

### Setup

Simply extend your `base` test fixture with the `Intercept` class, providing optional global configuration options:

- `fixturePathPrefix` is the path to your mock data folder
- `staticExtensions` are extensions of files to be ignored entirely

```typescript
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
  // first, set up the intercept
  const postUserDetailsEndpoint = intercept.post({
    url: "/callback/change-user-details",
    statusCode: 200,
    body: {
      status: "success",
    },
  });

  await page.goto("/my-account");

  await page.fill('input[name="name"]', "Bar");

  await page.locator("selector=save-button").click();

  // wait until the request has been made
  await postUserDetailsEndpoint.wait();

  // assert request body
  await expect(postUserDetailsEndpoint.requests[0].postDataJSON()).toBe({
    name: "Bar",
  });

  // update the intercept response body at runtime
  postUserDetailsEndpoint.update({
    statusCode: 400,
    body: {
      status: "fail",
    }
  });

  await page.locator("selector=save-button").click();

  // again, wait until the request has been made
  await postUserDetailsEndpoint.wait();

  await page.waitForSelector('div[role="alert"]');
});
```

> [!TIP]  
> This repo's [`tests`](https://github.com/alectrocute/playwright-intercept/tree/main/tests) folder contains various setup & usage examples.

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

### `<intercept>.wait({ timeout?: number })`

Resolves promise if requests have been made to the URL via selected method.

### `<intercept>.requests`

Gives you direct access to all requests made to the URL.

### `<intercept>.update(InterceptOptions | (InterceptOptions) => InterceptOptions)`

Allows you to change the options of an intercept post-initialization.
