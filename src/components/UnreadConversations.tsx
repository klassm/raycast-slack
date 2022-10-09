import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { compact, groupBy, sortBy } from "lodash";
import { useMemo } from "react";
import { SlackEntryWithUnread, useClientCounts } from "../hooks/useClientCounts";
import { MessageWithUser, useConversationHistory } from "../hooks/useConversationHistory";
import { useTeams } from "../hooks/useTeams";
import { SlackEntry } from "../types/SlackEntry";
import { TeamInfo } from "../types/TeamInfo";

export function UnreadConversations() {
  const { data, loading, markRead } = useClientCounts();
  const { teams } = useTeams();
  const groupedResults = useMemo(() => {
    const groupedByTeams = groupBy(data, (result) => result.teamId);
    const teamResults = teams
      .map((team) => [team, groupedByTeams[team.id] ?? []] as const)
      .filter(([_team, results]) => results.length > 0);
    return sortBy(teamResults, ([team]) => team.name);
  }, [teams, data]);

  const renderGroup = (team: TeamInfo, results: SlackEntryWithUnread[]) => {
    return (
      <List.Section title={team.name} key={team.id}>
        {results.map((result) => (
          <ConversationItem key={result.id} conversation={result} team={team} markRead={markRead} />
        ))}
      </List.Section>
    );
  };

  return (
    <List
      isLoading={loading}
      enableFiltering={true}
      searchBarPlaceholder="Filter Conversations..."
      throttle
      isShowingDetail={true}
    >
      {groupedResults.map(([group, results]) => renderGroup(group, results))}
    </List>
  );
}

function iconFor(channel: SlackEntry) {
  if (channel.icon === undefined) {
    return channel.type === "channel" ? { source: Icon.Hashtag } : { source: Icon.Person };
  }
  return { source: channel.icon };
}

function ConversationItem({
  conversation,
  team,
  markRead,
}: {
  conversation: SlackEntryWithUnread;
  team: TeamInfo;
  markRead: (conversation: SlackEntryWithUnread) => Promise<void>;
}) {
  const icon = iconFor(conversation);
  const url = `slack://channel?team=${conversation.teamId}&id=${conversation.id}`;

  return (
    <List.Item
      title={conversation.name}
      icon={icon}
      detail={<ConversationDetail conversation={conversation} team={team} />}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open" url={url} />
            <Action title="Mark Read" onAction={() => void markRead(conversation)} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function messageToMarkdown(message: MessageWithUser): string {
  const date = new Date(parseFloat(message.ts) * 1000).toLocaleString();
  const header = "### " + (message.user?.name ?? message.username ?? "???") + " " + date;
  const files = message.files !== undefined && message.files.length > 0 ? "<Files>" : undefined;
  const attachments = (message.attachments ?? [])
    .map((attachment) => attachment.fallback)
    .filter((fallback) => fallback !== message.text);
  const content = compact([message.text, files, ...attachments])
    .filter((it) => it)
    .join("\n");
  return header + "\n" + content;
}

function ConversationDetail({ conversation, team }: { conversation: SlackEntryWithUnread; team: TeamInfo }) {
  const { loading, data } = useConversationHistory(team, conversation);

  const markdown = useMemo(() => data.reverse().map(messageToMarkdown).join("\n\n"), [data]);
  return <List.Item.Detail markdown={markdown} isLoading={loading} />;
}
