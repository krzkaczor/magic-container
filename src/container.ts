import { mapValues } from "lodash";
import { isFunction, negate } from "lodash/fp";
import { TypeSafeDiWrapper, ConstantValue, Funktion } from "./wrappers";
import { ResolveContainer } from "./types";
import { DependencyTrackingProxy, ContainerProxy } from "./proxies";

export function container<T>(containerConfig: T): ResolveContainer<T> {
  const configWithDependencies = mapValues(containerConfig, value => {
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

export class Entity<T> {
  constructor(public readonly value: T, public readonly dependencies: string[]) {}

  public hasNoDependencies(): boolean {
    return this.dependencies.length === 0;
  }
}

const isConstant = (v: any) => negate(isFunction)(v) && !isWrapped(v);
const isWrapped = (v: any): v is TypeSafeDiWrapper<any> => v instanceof TypeSafeDiWrapper;
