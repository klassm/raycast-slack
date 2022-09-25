import fetch from "node-fetch";
import { ChannelBookmark } from "../types/ChannelBookmark";
import { Credentials } from "../types/Credentials";

interface BookmarksResponse {
  ok: boolean;
  bookmarks: BookmarkEntry[];
}

interface BookmarkEntry {
  id: string;
  title: string;
  link: string;
  icon_url?: string;
  type: string;
}

function isBookmarksResponse(value: unknown): value is BookmarksResponse {
  const response = value as BookmarksResponse;
  return (
    response.ok !== undefined &&
    Array.isArray(response.bookmarks) &&
    response.bookmarks.every(
      (bookmark) => bookmark.type !== undefined && bookmark.id !== undefined && bookmark.title !== undefined
    )
  );
}

export async function channelsBookmarks({ cookie, token }: Credentials, channelId: string): Promise<ChannelBookmark[]> {
  const response = await fetch(`https://slack.com/api/bookmarks.list?channel_id=${channelId}`, {
    method: "POST",
    headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      token: token,
      channel_id: channelId,
    }),
  });

  const result = await response.json();
  if (!isBookmarksResponse(result)) {
    console.log("Weird bookmarks response from Slack", result);
    throw new Error("Got a weird bookmarks response from Slack");
  }

  return result.bookmarks
    .filter((bookmark) => bookmark.type === "link")
    .map((bookmark) => ({
      id: bookmark.id,
      iconUrl: bookmark.icon_url,
      link: bookmark.link,
      title: bookmark.title,
    }));
}
