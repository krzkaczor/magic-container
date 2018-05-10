import { container } from "../src";
import { TAppConfig, getConfig } from "./config";
import { DerivedValue, DynamicFunction } from "../src/wrappers";

export interface IAppContainer {
  env: NodeJS.ProcessEnv;
  config: TAppConfig;
  log: (msg: any) => void;
}

export function getContainer(): IAppContainer {
  return container({
    env: process.env,
    config: new DerivedValue(getConfig),
    log: new DynamicFunction((_, ctx) => (msg: any) => {
      // tslint:disable-next-line
      console.log(ctx.path[1], ":", msg);
    }),
  });
}

// tslint:disable-next-line
console.log("config: ", getContainer().config);
