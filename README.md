# playwright-intercept

This extension library provides a Cypress-influenced API for intercepting network requests in Playwright.

### Features

- Strongly typed with TypeScript
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
  let groupDetailsJson = { id: 123, name: 'My Group!' };
  let groupDetailsStatusCode = 200;

  // example passing "body",
  const getUserDetails = intercept.get({
    url: "/callback/user-details",
    body: {
      id: 0,
      username: "alectrocute",
    },
  });

  // example passing "handler" with dynamic properties,
  const getGroupDetails = intercept.get({
    url: "/callback/group-details",
    handler: ({ route }) => {
      route.fulfill({
        json: groupDetailsJson,
        status: groupDetailsStatusCode,
      });
    },
  });

  // example passing "fixture" and optionally, "modifier",
  const getForm = intercept.get({
    url: "/callback/form/:id/get",
    fixture: "example-fixture-2.json",
    modifier: ({ body, params }) => {
      const { id } = params;
      body.id = id;
      return body;
    },
  });

  // example passing only "statusCode",
  const saveForm = intercept.post({
    url: "/callback/form/*/save",
    statusCode: 200,
  });

  await page.goto("/form-page");

  await getUserDetails.wait();

  await getGroupDetails.wait();

  await getForm.wait();

  await page.fill('input[name="foo"]', "Bar");

  await page.locator("selector=save-button").click();

  await saveForm.wait();

  getUserDetails.update({
    body: {
      id: 1,
    }
  })

  // Alternatively, update options with a function:

  // getUserDetails.update(options => {
  //   options.body = {
  //     id: 1,
  //   }

  //   return options;
  // });

  await expect(saveForm.requests[0].postDataJSON()).toBe({
    foo: "Bar",
  });

  await page.waitForSelector('div[role="alert"]');
});
```

> [!TIP]  
> This repo's [`tests`](https://github.com/alectrocute/playwright-intercept/tree/main/tests) folder contains various setup & usage examples.

## API

### `intercept[.get, .post, .put, .delete]`

```typescript
type NamedRouteParams = Record<string | number, string | number>;

type InterceptOptions = {
  url: string; // URL or path to intercept, wildcards and named params supported
  statusCode?: number; // Status code for response, default: 200
  delay?: number; // Amount of time in milliseconds to delay response
} & (
  | ({
      mimeType?: string; // Override auto-detection and define explicit mime type
      modifier?: (args: {
        body: any; // Parsed response body object or string
        params: NamedRouteParams; // Any named route param matches in request URL
        request: Request; // Full Playwright "Request" if/when needed
      }) => any; // Return the modified JSON body
    } & (
      | {
          body: Buffer | Object | string; // Response body buffer, JS object or string
        }
      | {
          fixture: string; // Path to file
        }
    ))
  | {
      // For advanced use cases, pass a handler function to manually construct response
      handler: (args: {
        route: Route; // Full Playwright "Route" object
        params: NamedRouteParams; // Any named route param matches in request URL
        request: Request; // Full Playwright "Request" object
      }) => void; // Return with `route.fulfill(...)` or `route.abort()`
    }
  | { statusCode: number } // Optionally, return only a status code
);
```

### `<intercept>.wait({ timeout?: number })`

Resolves promise if requests have been made to the URL via selected method.

### `<intercept>.requests`

Gives you direct access to all requests.

### `<intercept>.update(InterceptOptions | (InterceptOptions) => InterceptOptions)`

Allows you to change the options of an intercept post-initialization.
