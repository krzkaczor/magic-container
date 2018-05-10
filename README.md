<p align="center">
  <img src="https://emojipedia-us.s3.amazonaws.com/thumbs/120/apple/129/unicorn-face_1f984.png" width="120" alt="Magic Container">
  <h3 align="center">Magic Container</h3>
  <p align="center">Type safe dependency injection container with super powers!</p>
  <p align="center">
    <a href="https://circleci.com/gh/krzkaczor/magic-container"><img alt="Build Status" src="https://circleci.com/gh/krzkaczor/magic-container/tree/master.svg?style=svg"></a>
    <a href="/package.json"><img alt="Software License" src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square"></a>
  </p>
</p>

## Features

* fully type safe 💯
* works great both with functions and classes 😍
* doesn't pollute your codebase — it's just object destruction ☣️
* lightweight — less then 1kB gzipped 🐥

## Example

First, describe your application container:

```typescript
export interface IAppContainer {
  logger: (msg: any) => void;
  httpClient: IHttpClient;
  createUser: (name: string) => Promise<void>;
}
```

Then, create function that creates `magicContainer` using config:

```typescript
import { magicContainer, DynamicFunction, IResolutionCtx, Clazz } from "../src";

export function getContainer(): IAppContainer {
  return magicContainer({
    createUser: ({ logger, httpClient }: IAppContainer) => async (name: string) => {
      logger(`Creating new user: ${name}`);
      await httpClient.post(name);
    },

    // if you want to inject class you need to use special wrapper Clazz
    httpClient: new Clazz(HttpClient),

    // DynamicFunctions have access to dependency resolution context so you can automatically create new logger instance with context information about the parent class
    logger: new DynamicFunction((_: IAppContainer, ctx: IResolutionCtx) => (msg: string) =>
      console.log(`${ctx.path[1]}: ${msg}`),
    ),
  });
}
```

Finally, resolve any dependency like it would be a regular javascript object:

```typescript
const container = getContainer();

// dependencies are evaluated lazily
// magic-container will take care of created any instances of dependencies if needed
container.createUser("krzkaczor");
```

## How does it work?

The key is usage of ES6 proxies.

### Dependency tracking

`magic-container` doesn't use any decorators to describe dependencies etc. What happens is that there is a proxy
injected that records any access to container so later real dependencies could be injected in place. Currently it's a 2
stage process but in the future it could happen in the same time, reducing abstraction leaking problems (first, your
class / function gets injected with `undefined` in place of all dependencies which can result in weird behaviour if you
accessed it there).

## License

MIT @ [Krzysztof Kaczor](https://twitter.com/krzKaczor)
