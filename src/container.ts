import { TypeSafeDiWrapper, ConstantValue, Funktion } from "./wrappers";
import { ResolveContainer } from "./types";
import { DependencyTrackingProxy, ContainerProxy } from "./proxies.private";
import { TDictionary } from "./types.private";

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

const isConstant = (v: any) => typeof v !== "function" && !isWrapped(v);
const isWrapped = (v: any): v is TypeSafeDiWrapper<any> => v instanceof TypeSafeDiWrapper;

function mapValues(v: TDictionary<any>, func: (v: any) => any): TDictionary<any> {
  const newValues = Object.keys(v).map(k => ({ key: k, val: func(v[k]) }));

  return newValues.reduce<TDictionary<any>>((acc, cur) => ({ ...acc, [cur.key]: cur.val }), {});
}
