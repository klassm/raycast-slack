import { countBy, keyBy, sortBy, takeRight } from "lodash";
import { SlackChannel } from "../types/SlackChannel";
import { useCache } from "./useCache";
import { useMemo } from "react";

function getMostUsed(channels: SlackChannel[]): SlackChannel[] {
  const lookupChannels = keyBy(channels, (channel) => channel.id);
  const countEntries = Object.entries(countBy(channels, (channel) => channel.id));
  return sortBy(countEntries, ([_entry, count]) => count)
    .reverse()
    .slice(0, 20)
    .map(([id]) => lookupChannels[id])
    .filter((channel): channel is SlackChannel => channel !== undefined);
}

function updateLastUsed(oldData: SlackChannel[], newEntry: SlackChannel): SlackChannel[] {
  const newEntries = [...oldData, newEntry];
  return takeRight(newEntries, 100);
}

export function useMostUsed() {
  const { data, update } = useCache<SlackChannel[]>("slack-most-used", async () => [], {
    expirationMillis: 1000 * 60 * 24 * 60,
  });
  const mostUsed = useMemo(() => getMostUsed(data ?? []), [data]);

  return { mostUsed, add: (channel: SlackChannel) => update(updateLastUsed(data ?? [], channel)) };
}
