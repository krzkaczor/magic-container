import { Funktion } from "../src/wrappers";
import { spy } from "sinon";
import { expect } from "chai";

describe("Funktion Wrapper", () => {
  it("should cache created wrapper", () => {
    const internalFn = spy();
    const fn = spy(() => internalFn);
    const container = {};

    const functionWrapper = new Funktion(fn);

    functionWrapper.apply(container);
    functionWrapper.apply(container);

    expect(fn).to.be.calledOnce;
    expect(fn).to.be.calledWithExactly(container);
  });
});
