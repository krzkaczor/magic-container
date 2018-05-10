import { IAppContainer } from ".";

export const getConfig = ({ env, log }: IAppContainer) => () => {
  log("Test");
  return {
    mode: env.NODE_ENV,
  };
};

export type TAppConfig = ReturnType<ReturnType<typeof getConfig>>;
