import { useEffect, useState } from "react";
import { channelsBookmarks } from "../slack/channelBookmarks";
import type { ChannelBookmark } from "../types/ChannelBookmark";
import type { SlackEntry } from "../types/SlackEntry";
import type { TeamInfo } from "../types/TeamInfo";
import { useConfig } from "./useConfig";

export function useBookmarks(channel: SlackEntry, team: TeamInfo) {
	const {
		config: { cookie },
	} = useConfig();
	const [bookmarks, setBookmarks] = useState<ChannelBookmark[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		setLoading(true);
		channelsBookmarks({ cookie, token: team.token }, channel.id)
			.then(setBookmarks)
			.finally(() => setLoading(false));
	}, [channel, team]);

	return { bookmarks, loading };
}
