import { getPreferenceValues } from "@raycast/api";
import { Config } from "../types/Config";

export function useConfig(): { config: Config } {
  const { tokens, cookie } = getPreferenceValues();

  return {
    config: {
      cookie,
      tokens: tokens.split(","),
    },
  };
}
