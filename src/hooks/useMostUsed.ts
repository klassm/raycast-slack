import { countBy, keyBy, sortBy, takeRight } from "lodash";
import { SlackEntry } from "../types/SlackEntry";
import { useCache } from "./useCache";
import { useMemo } from "react";

function getMostUsed(channels: SlackEntry[]): SlackEntry[] {
  const lookupChannels = keyBy(channels, (channel) => channel.id);
  const countEntries = Object.entries(countBy(channels, (channel) => channel.id));
  return sortBy(countEntries, ([_entry, count]) => count)
    .reverse()
    .slice(0, 20)
    .map(([id]) => lookupChannels[id])
    .filter((channel): channel is SlackEntry => channel !== undefined);
}

function updateLastUsed(oldData: SlackEntry[], newEntry: SlackEntry): SlackEntry[] {
  const newEntries = [...oldData, newEntry];
  return takeRight(newEntries, 1000);
}

export function useMostUsed() {
  const { data, update } = useCache<SlackEntry[]>("slack-most-used", async () => [], {
    expirationMillis: 1000 * 60 * 60 * 24 * 60 ,
  });
  const mostUsed = useMemo(() => getMostUsed(data ?? []), [data]);

  return { mostUsed, add: (channel: SlackEntry) => update(updateLastUsed(data ?? [], channel)) };
}
