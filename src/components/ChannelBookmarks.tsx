import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { sortBy } from "lodash";
import { useMemo } from "react";
import { useBookmarks } from "../hooks/useBookmarks";
import { ChannelBookmark } from "../types/ChannelBookmark";
import { SlackChannel } from "../types/SlackChannel";
import { TeamInfo } from "../types/TeamInfo";

interface ChannelBookmarksProps {
  team: TeamInfo;
  channel: SlackChannel;
}

export function ChannelBookmarks({ channel, team }: ChannelBookmarksProps) {
  const { bookmarks, loading } = useBookmarks(channel, team);
  const sortedBookmars = useMemo(() => sortBy(bookmarks, (bookmark) => bookmark.title.toLowerCase()), [bookmarks]);
  return (
    <List isLoading={loading} enableFiltering={true} searchBarPlaceholder={`Bookmarks ${channel.name}`} throttle>
      {sortedBookmars.map((bookmark) => (
        <Bookmark key={bookmark.id} bookmark={bookmark} />
      ))}
    </List>
  );
}

function iconFor(bookmark: ChannelBookmark) {
  if (bookmark.iconUrl === undefined) {
    return { source: Icon.Link };
  }
  return { source: bookmark.iconUrl };
}

function Bookmark({ bookmark }: { bookmark: ChannelBookmark }) {
  const icon = iconFor(bookmark);
  return (
    <List.Item
      title={bookmark.title}
      icon={icon}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open" url={bookmark.link} />
            <Action.CopyToClipboard title="Copy" content={bookmark.link} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
