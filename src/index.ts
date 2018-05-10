import { mapValues, isString } from "lodash";
import { isFunction, negate } from "lodash/fp";
import { DerivedValue, TypeSafeDiWrapper, ConstantValue, Funktion, DynamicFunction } from "./wrappers";

export function container<T>(containerConfig: T): ResolveContainer<T> {
  const configWithDependencies = mapValues(containerConfig, (value, key) => {
    if (isConstant(value)) {
      return new Entity(new ConstantValue(value), []);
    }
    const wrappedValue = isWrapped(value) ? value : new Funktion(value);

    const dependencyTrackingProxy = new DependencyTrackingProxy<ResolveContainer<T>>();
    wrappedValue.trackDeps(dependencyTrackingProxy.proxy);

    return new Entity(wrappedValue, Array.from(dependencyTrackingProxy.dependencies));
  });

  const containerProxy = new ContainerProxy(configWithDependencies as any);

  return containerProxy.proxy as any;
}
export type ResolveContainer<T> = {
  [K in keyof T]: T[K] extends DerivedValue<infer C>
    ? C
    : T[K] extends DynamicFunction<infer C> ? C : T[K] extends (deps: T) => infer D ? D : T[K]
};

class Entity<T> {
  constructor(public readonly value: T, public readonly dependencies: string[]) {}

  public hasNoDependencies(): boolean {
    return this.dependencies.length === 0;
  }
}

class DependencyTrackingProxy<TContainer> {
  public readonly proxy: TContainer;
  public dependencies: Set<string> = new Set();

  constructor() {
    this.proxy = new Proxy(
      {},
      {
        get: (target, name) => {
          if (!isString(name)) {
            throw new Error("Only strings are accepted as keys inside container");
          }

          this.dependencies.add(name);

          return undefined;
        },
      },
    ) as any;
  }
}

class ContainerProxy<T extends TDictionary<Entity<TypeSafeDiWrapper<any>>>> {
  public readonly proxy: ResolveContainer<T>;

  constructor(private readonly entities: T) {
    this.proxy = new Proxy(
      {},
      {
        get: (target, name) => {
          if (!isString(name)) {
            throw new Error("Only strings are accepted as keys inside container");
          }

          return this.resolve(name, { depth: 1, path: [name] });
        },
      },
    ) as any;
  }

  private resolve(name: string, ctx: IResolutionCtx): any {
    console.log("resolving: ", name);

    const entity = this.entities[name];
    if (!entity) {
      throw new Error(`${name} is missing in the container`);
    }

    if (entity.dependencies.length === 0) {
      return this.resolveValue(entity.value, undefined, ctx);
    }

    const resolvedDeps = entity.dependencies.map(dependencyName => ({
      name: dependencyName,
      value: this.resolve(dependencyName, { depth: ctx.depth + 1, path: [dependencyName, ...ctx.path] }),
    }));

    const miniContainer = resolvedDeps.reduce((acc, current) => ({ [current.name]: current.value, ...acc }), {});

    return this.resolveValue(entity.value, miniContainer, ctx);
  }

  private resolveValue(value: TypeSafeDiWrapper<any>, container: any, ctx: IResolutionCtx) {
    return value.apply(container, ctx);
  }
}

const isConstant = (v: any) => negate(isFunction)(v) && !isWrapped(v);
const isWrapped = (v: any): v is TypeSafeDiWrapper<any> => v instanceof TypeSafeDiWrapper;

type TDictionary<V> = {
  [k: string]: V | undefined;
};

export interface IResolutionCtx {
  depth: number;
  path: string[];
}
