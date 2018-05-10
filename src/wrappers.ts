import { IResolutionCtx } from "./types";

export abstract class TypeSafeDiWrapper<T> {
  public abstract apply(container: any, ctx: IResolutionCtx): T;
  public abstract trackDeps(proxy: any): void;
}

export class Clazz<T extends new (...args: any[]) => any> extends TypeSafeDiWrapper<T> {
  constructor(public readonly clazz: T) {
    super();
  }
  public apply(container: any): T {
    return new this.clazz(container);
  }
  public trackDeps(proxy: any): void {
    new this.clazz(proxy);
  }
}

export class DerivedValue<C> extends TypeSafeDiWrapper<C> {
  private cached?: C;
  constructor(public readonly fn: (d: any) => () => C) {
    super();
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

export class DynamicFunction<C extends Function> extends TypeSafeDiWrapper<C> {
  constructor(public readonly value: (d: any, c: IResolutionCtx) => C) {
    super();
  }
  apply(container: any, ctx: IResolutionCtx): C {
    return this.value(container, ctx);
  }
  public trackDeps(proxy: any): void {
    this.value(proxy, undefined as any);
  }
}

export class ConstantValue<C> extends TypeSafeDiWrapper<C> {
  constructor(public readonly value: C) {
    super();
  }
  apply(_container: any): C {
    return this.value;
  }
  public trackDeps(_proxy: any): void {}
}

export class Funktion<C extends Function> extends TypeSafeDiWrapper<C> {
  private cached?: C;
  constructor(public readonly fn: C) {
    super();
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
