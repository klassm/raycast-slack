import { useEffect, useState } from "react";
import { searchConversations } from "../services/searchConversations";
import { search } from "../slack/search";
import type { Credentials } from "../types/Credentials";
import type { SlackEntry } from "../types/SlackEntry";
import type { TeamInfo } from "../types/TeamInfo";
import { useConfig } from "./useConfig";
import { useMostUsed } from "./useMostUsed";
import { useTeams } from "./useTeams";

async function searchTeam(
	credentials: Credentials,
	team: TeamInfo,
	query: string,
): Promise<SlackEntry[]> {
	const results = await Promise.all([
		search(credentials, query),
		searchConversations(credentials, team.id, query),
	]);
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

	const { teamPrefix, searchItem } = splitQueryIntoPrefixAndSearchItem(query);
	const relevantTeams = filterTeams(teamPrefix, teams);

	useEffect(() => {
		if (query) {
			setLoading(true);
			Promise.all(
				relevantTeams.map((team) =>
					searchTeam({ cookie, token: team.token }, team, searchItem),
				),
			)
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

function splitQueryIntoPrefixAndSearchItem(query: string): {
	teamPrefix: string;
	searchItem: string;
} {
	if (!query.startsWith("-")) {
		return { teamPrefix: "", searchItem: query };
	}

	const teamPrefix = query.substring(1, query.indexOf(" ")).toLowerCase();
	const searchItem = query.substring(1 + teamPrefix.length);

	return { teamPrefix, searchItem };
}

function filterTeams(teamPrefix: string, teams: TeamInfo[]): TeamInfo[] {
	return teams.filter((team) => team.name.toLowerCase().startsWith(teamPrefix));
}
