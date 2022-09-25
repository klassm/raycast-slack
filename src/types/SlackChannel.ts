export interface SlackChannel {
  teamId: string;
  name: string;
  id: string;
  icon?: string;
  type: ChannelType;
}

export type ChannelType = "channel" | "user";
