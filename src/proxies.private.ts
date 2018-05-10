import { ResolveContainer, IResolutionCtx } from "./types";
import { TypeSafeDiWrapper } from "./wrappers";
import { TDictionary } from "./types.private";

export class DependencyTrackingProxy<TContainer> {
  public readonly proxy: TContainer;
  public dependencies: Set<string> = new Set();

  constructor() {
    this.proxy = new Proxy(
      {},
      {
        get: (_target, name) => {
          if (typeof name !== "string") {
            throw new Error("Only strings are accepted as keys inside container");
          }

          this.dependencies.add(name);

          return undefined;
        },
      },
    ) as any;
  }
}

const RESOLVE_DEPTH_LIMIT = 20;

export class ContainerProxy<T extends TDictionary<TypeSafeDiWrapper<any>>> {
  public readonly proxy: ResolveContainer<T>;

  constructor(private readonly entities: T) {
    this.proxy = new Proxy(
      {},
      {
        get: (_target, name) => {
          if (typeof name !== "string") {
            throw new Error("Only strings are accepted as keys inside container");
          }

          return this.resolve(name, { depth: 1, path: [name] });
        },
      },
    ) as any;
  }

  private resolve(name: string, ctx: IResolutionCtx): any {
    if (ctx.depth > RESOLVE_DEPTH_LIMIT) {
      throw new Error(`Circular dependency detected: ${ctx.path}`);
    }

    const entity = this.entities[name];
    if (!entity) {
      throw new Error(`${name} is missing in the container`);
    }

    if (entity.dependencies.length === 0) {
      return entity.apply(undefined, ctx);
    }

    const resolvedDeps = entity.dependencies.map(dependencyName => ({
      name: dependencyName,
      value: this.resolve(dependencyName, { depth: ctx.depth + 1, path: [dependencyName, ...ctx.path] }),
    }));

    const miniContainer = resolvedDeps.reduce<TDictionary<any>>(
      (acc, current) => ({ [current.name]: current.value, ...acc }),
      {},
    );

    return entity.apply(miniContainer, ctx);
  }
}
