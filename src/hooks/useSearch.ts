import { useEffect, useState } from "react";
import { search } from "../slack/search";
import { searchConversations } from "../slack/searchConversations";
import { Credentials } from "../types/Credentials";
import { SlackEntry } from "../types/SlackEntry";
import { TeamInfo } from "../types/TeamInfo";
import { useConfig } from "./useConfig";
import { useMostUsed } from "./useMostUsed";
import { useTeams } from "./useTeams";

async function searchTeam(credentials: Credentials, team: TeamInfo, query: string): Promise<SlackEntry[]> {
  const results = await Promise.all([search(credentials, query), searchConversations(credentials, team.id, query)]);
  return results.flat();
}

export function useSearch() {
  const { teams, loading: teamsLoading } = useTeams();
  const {
    config: { cookie },
  } = useConfig();
  const [searchResults, setSearchResults] = useState<SlackEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { mostUsed, add: addMostUsed } = useMostUsed();

  useEffect(() => {
    if (query) {
      setLoading(true);
      Promise.all(teams.map((team) => searchTeam({ cookie, token: team.token }, team, query)))
        .then((results) => results.flat())
        .then(setSearchResults)
        .then(() => setLoading(false));
    } else {
      setSearchResults(mostUsed);
    }
  }, [teams, query]);

  return {
    setQuery,
    loading: teamsLoading || loading,
    searchResults,
    teams,
    addMostUsed,
  };
}
