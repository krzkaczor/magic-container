import { DerivedValue, DynamicFunction, Clazz } from "./wrappers";

export interface IResolutionCtx {
  depth: number;
  path: string[];
}

export type ResolveContainer<T> = {
  [K in keyof T]: T[K] extends DerivedValue<infer C>
    ? C
    : T[K] extends DynamicFunction<infer C>
      ? C
      : T[K] extends Clazz<infer C> ? InstanceType<C> : T[K] extends (deps: any) => infer D ? D : T[K]
};
