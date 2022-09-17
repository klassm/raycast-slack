import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { sortBy, sum } from "lodash";
import { useEffect, useState } from "react";
import replaceSpecialCharacters from "replace-special-characters"
import { provideAlfredSlackJson } from "./alfredSlackJson";
import { SlackChannel } from "./SlackChannel";

type SearchableData = SlackChannel & {
  team: string;
}

const useData = () => {
  const [data, setData] = useState<SearchableData[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    provideAlfredSlackJson()
      .then(data => {
        const withTeam = data
          .flatMap(({ channels, team }) => channels.map(channel => ( { ...channel, team } )))
        setData(withTeam);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

const normalize = (value: string): string => {
  return replaceSpecialCharacters(value).toLowerCase().normalize();
}

const searchScoreFor = (queryParts: string[], data: SearchableData): number => {
  const keywords = normalize(data.name).split(/[-_]/)
  const allPartsMatch = queryParts.every(part => keywords.some(keyword => keyword.includes(part)));
  if (!allPartsMatch) {
    return -1;
  }

  const keywordScores = keywords.map(keyword => {
    const part = queryParts.find(part => keyword.includes(part));
    return part ? part.length / keyword.length : 0;
  })

  return sum(keywordScores) / keywords.length;
}

const search = (query: string, data: SearchableData[]): SearchableData[] => {
  const queryParts = normalize(query).split(/[ -_]/);
  const withScore = data
    .map(entry => ( {
      ...entry,
      score: searchScoreFor(queryParts, entry)
    } ))
    .filter(entry => entry.score > 0);

  const sorted = sortBy(withScore, entry => entry.score).reverse();
  return sorted.slice(0, 20);
}

export default function SlackList() {
  const { data, loading } = useData()
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableData[]>([]);

  useEffect(() => {
    const results = search(searchText, data)
    setSearchResults(results);
  }, [searchText]);

  return (
    <List isLoading={ loading } enableFiltering={ false } searchText={ searchText }
          onSearchTextChange={ setSearchText } searchBarPlaceholder="Search Slack..." throttle>
      <List.Section title="Results">
        { ( searchResults ?? [] ).map((entry) => (
          <SlackItem key={ entry.id } channel={ entry }/>
        )) }
      </List.Section>
    </List>
  );
}


function SlackItem({ channel }: { channel: SearchableData }) {
  const icon = channel.name.startsWith("#") ? { source: Icon.Hashtag } : { source: Icon.Person };
  const url = `slack://channel?team=${channel.teamId}&id=${channel.id}`;
  return (
    <List.Item
      title={ channel.name }
      subtitle={ channel.team }
      icon={ icon }
      actions={ (
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open" url={ url }/>
          </ActionPanel.Section>
        </ActionPanel>
      ) }
    />
  );
}
