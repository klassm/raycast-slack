import { useEffect, useState } from "react";
import { search } from "../slack/search";
import { SlackChannel } from "../types/SlackChannel";
import { useConfig } from "./useConfig";
import { useMostUsed } from "./useMostUsed";
import { useTeams } from "./useTeams";

export function useSearch() {
  const { teams, loading: teamsLoading } = useTeams();
  const {
    config: { cookie },
  } = useConfig();
  const [searchResults, setSearchResults] = useState<SlackChannel[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { mostUsed, add: addMostUsed } = useMostUsed();

  useEffect(() => {
    if (query) {
      setLoading(true);
      Promise.all(teams.map((team) => search({ cookie, token: team.token }, query)))
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
