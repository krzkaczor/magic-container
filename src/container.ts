import { mapValues } from "lodash";
import { isFunction, negate } from "lodash/fp";
import { TypeSafeDiWrapper, ConstantValue, Funktion } from "./wrappers";
import { ResolveContainer } from "./types";
import { DependencyTrackingProxy, ContainerProxy } from "./proxies";

export function magicContainer<T>(containerConfig: T): ResolveContainer<T> {
  const configWithDependencies = mapValues(containerConfig, value => {
    if (isConstant(value)) {
      return new ConstantValue(value);
    }
    const wrappedValue = isWrapped(value) ? value : new Funktion(value);

    const dependencyTrackingProxy = new DependencyTrackingProxy<ResolveContainer<T>>();
    wrappedValue.trackDeps(dependencyTrackingProxy.proxy);

    wrappedValue.dependencies = Array.from(dependencyTrackingProxy.dependencies);

    return wrappedValue;
  });

  const containerProxy = new ContainerProxy(configWithDependencies as any);

  return containerProxy.proxy as any;
}

const isConstant = (v: any) => negate(isFunction)(v) && !isWrapped(v);
const isWrapped = (v: any): v is TypeSafeDiWrapper<any> => v instanceof TypeSafeDiWrapper;
