import { expect } from "chai";
import { spy } from "sinon";

import { magicContainer, IResolutionCtx, DerivedValue, DynamicFunction, Clazz } from "../src/index";

describe("magic-container", () => {
  it("should work", () => {
    interface IContainer {
      constantValue: number;
      derivedValue: number;
      function: (adder: number) => number;
      cls: Cls;
      dynamicFunction: (msg: string) => void;
    }

    const constantValue = 3;
    const derivedValueCalc = ({ constantValue }: IContainer) => () => constantValue + 5;
    const fn = ({ derivedValue }: IContainer) => (adder: number) => adder + derivedValue;
    class Cls {
      private readonly fn: (adder: number) => number;
      private readonly fnDyn: (msg: string) => void;
      constructor(c: IContainer) {
        this.fn = c.function;
        this.fnDyn = c.dynamicFunction;
      }

      public doSmt(): number {
        this.fnDyn("Gonna do smt!");
        return this.fn(11);
      }
    }
    const loggerSpy = spy((_s: string) => undefined);
    const logger = (_c: any, ctx: IResolutionCtx) => (message: string) => loggerSpy(`${ctx.path[1]}: ${message}`);

    const c: IContainer = magicContainer({
      constantValue,
      derivedValue: new DerivedValue(derivedValueCalc),
      function: fn,
      dynamicFunction: new DynamicFunction(logger),
      cls: new Clazz(Cls),
    });

    expect(c.constantValue).to.be.eq(constantValue);
    expect(c.derivedValue).to.be.eq(constantValue + 5);
    expect(c.function(7)).to.be.eq(constantValue + 5 + 7);
    expect(c.cls.doSmt()).to.be.eq(constantValue + 5 + 11);
    expect(loggerSpy).to.be.calledOnce;
    expect(loggerSpy).to.be.calledWithExactly("cls: Gonna do smt!");
  });

  it("should detect circular dependencies", () => {
    interface IContainer {
      functionA: () => void;
      functionB: () => void;
    }

    const c: IContainer = magicContainer({
      functionA: ({ functionB: _functionB }: IContainer) => () => {},
      functionB: ({ functionA: _functionA }: IContainer) => () => {},
    });

    expect(() => c.functionA).to.throw(
      "Circular dependency detected: functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA,functionB,functionA",
    );
  });
});
