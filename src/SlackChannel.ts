import { uniqBy } from "lodash";

export interface SlackChannel {
  teamId: string;
  name: string;
  id: string;
}

export function mergeChannels(teamChannels: SlackChannel[], newChannels: SlackChannel[]): SlackChannel[] {
  const channels = [...teamChannels, ...newChannels];
  return uniqBy(channels, channel => channel.id);
}
