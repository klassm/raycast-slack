import { teamInfo } from "../slack/teamInfo";
import { TeamInfo } from "../types/TeamInfo";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function useTeams() {
  const {
    config: { cookie, tokens },
  } = useConfig();
  const provider = async (): Promise<TeamInfo[]> =>
    Promise.all(
      tokens.map((token) =>
        teamInfo({
          cookie,
          token,
        })
      )
    );
  const { loading, data } = useCache<TeamInfo[]>("slack-teams", provider, { expirationMillis: 1000 * 60 * 60 * 24 });
  return { loading, teams: data ?? [] };
}
