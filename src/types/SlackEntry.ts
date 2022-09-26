interface BaseEntry {
  teamId: string;
  name: string;
  id: string;
  icon?: string;
  type: ChannelType;
}

export interface SlackChannel extends BaseEntry {
  type: "channel";
}

export interface SlackUser extends BaseEntry {
  type: "user";
  email?: string;
  title?: string;
}

export type ChannelType = "channel" | "user";
export type SlackEntry = SlackChannel | SlackUser;
