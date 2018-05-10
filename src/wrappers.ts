import { IResolutionCtx } from "./types";

/**
 * Base class for all wrappers
 */
export abstract class TypeSafeDiWrapper<T> {
  constructor(public dependencies: ReadonlyArray<string> = []) {}

  public abstract apply(container: any, ctx: IResolutionCtx): T;
  public abstract trackDeps(proxy: any): void;
}

/**
 * Wraps singleton class.
 */
export class Clazz<T extends new (...args: any[]) => any> extends TypeSafeDiWrapper<T> {
  constructor(public readonly clazz: T, explicitDependencies?: ReadonlyArray<string>) {
    super(explicitDependencies);
  }
  public apply(container: any): T {
    return new this.clazz(container);
  }
  public trackDeps(proxy: any): void {
    new this.clazz(proxy);
  }
}

/**
 * Derives constant value from the container. Useful for configs etc.
 */
export class DerivedValue<C> extends TypeSafeDiWrapper<C> {
  private cached?: C;
  constructor(public readonly fn: (d: any) => () => C, explicitDependencies?: ReadonlyArray<string>) {
    super(explicitDependencies);
  }
  apply(container: any): C {
    if (!this.cached) {
      this.cached = this.fn(container)();
    }
    return this.cached;
  }
  public trackDeps(proxy: any): void {
    this.fn(proxy);
  }
}

/**
 * Dynamic function that can use runtime information about container state.
 */
export class DynamicFunction<C extends Function> extends TypeSafeDiWrapper<C> {
  constructor(public readonly value: (d: any, c: IResolutionCtx) => C, explicitDependencies?: ReadonlyArray<string>) {
    super(explicitDependencies);
  }
  apply(container: any, ctx: IResolutionCtx): C {
    return this.value(container, ctx);
  }
  public trackDeps(proxy: any): void {
    this.value(proxy, undefined as any);
  }
}

/**
 * Constant value. Default type for everything which is not a function.
 */
export class ConstantValue<C> extends TypeSafeDiWrapper<C> {
  constructor(public readonly value: C) {
    super();
  }
  apply(_container: any): C {
    return this.value;
  }
  public trackDeps(_proxy: any): void {}
}

/**
 * Function type. Default for functions in the container.
 */
export class Funktion<C extends Function> extends TypeSafeDiWrapper<C> {
  private cached?: C;
  constructor(public readonly fn: C, explicitDependencies?: ReadonlyArray<string>) {
    super(explicitDependencies);
  }
  apply(container: any): C {
    if (!this.cached) {
      this.cached = this.fn(container);
    }
    return this.cached!;
  }
  public trackDeps(proxy: any): void {
    return this.fn(proxy);
  }
}
