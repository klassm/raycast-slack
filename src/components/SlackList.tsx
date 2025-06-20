import { Action, ActionPanel, Icon, List, useNavigation } from "@raycast/api";
import { groupBy, sortBy } from "lodash";
import { useMemo } from "react";
import { useSearch } from "../hooks/useSearch";
import type { SlackEntry } from "../types/SlackEntry";
import type { TeamInfo } from "../types/TeamInfo";
import { ChannelBookmarks } from "./ChannelBookmarks";

export function SlackList() {
	const { searchResults, loading, setQuery, addMostUsed, teams } = useSearch();
	const groupedResults = useMemo(() => {
		const groupedByTeams = groupBy(searchResults, (result) => result.teamId);
		const teamResults = teams
			.map((team) => [team, groupedByTeams[team.id] ?? []] as const)
			.filter(([_team, results]) => results.length > 0);
		return sortBy(teamResults, ([team]) => team.name);
	}, [teams, searchResults]);

	const renderGroup = (team: TeamInfo, results: SlackEntry[]) => {
		return (
			<List.Section title={team.name} key={team.id}>
				{results.map((result) => (
					<SlackItem
						key={result.id}
						channel={result}
						team={team}
						addMostUsed={() => addMostUsed(result)}
					/>
				))}
			</List.Section>
		);
	};

	return (
		<List
			isLoading={loading}
			enableFiltering={false}
			onSearchTextChange={setQuery}
			searchBarPlaceholder="Search Slack..."
			throttle
		>
			{groupedResults.map(([group, results]) => renderGroup(group, results))}
		</List>
	);
}

function iconFor(channel: SlackEntry) {
	if (channel.icon === undefined) {
		return channel.type === "channel"
			? { source: Icon.Hashtag }
			: { source: Icon.Person };
	}
	return { source: channel.icon };
}

function SlackItem({
	channel,
	addMostUsed,
	team,
}: {
	channel: SlackEntry;
	team: TeamInfo;
	addMostUsed: () => void;
}) {
	const icon = iconFor(channel);
	const url = `slack://channel?team=${channel.teamId}&id=${channel.id}`;
	const accessories = channel.type === "user" ? [{ text: channel.title }] : [];

	const { push } = useNavigation();
	const bookmarksAction =
		channel.type === "channel" ? (
			<Action
				title="Bookmarks"
				onAction={() => {
					addMostUsed();
					push(<ChannelBookmarks team={team} channel={channel} />);
				}}
			/>
		) : null;
	const emailAction =
		channel.email !== undefined ? (
			<Action.OpenInBrowser
				url={`mailto:${channel.email}`}
				title="Send Mail"
				onOpen={addMostUsed}
			/>
		) : null;
	const copyEmailAction =
		channel.email !== undefined ? (
			<Action.CopyToClipboard content={channel.email} title="Copy Mail" />
		) : null;
	return (
		<List.Item
			title={channel.name}
			accessories={accessories}
			icon={icon}
			actions={
				<ActionPanel>
					<ActionPanel.Section>
						<Action.OpenInBrowser onOpen={addMostUsed} title="Open" url={url} />
						{bookmarksAction}
						{emailAction}
						{copyEmailAction}
					</ActionPanel.Section>
				</ActionPanel>
			}
		/>
	);
}
