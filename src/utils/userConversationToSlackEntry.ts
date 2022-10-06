import { Identity } from "../slack/identity";
import { User } from "../slack/users";
import { SlackEntry } from "../types/SlackEntry";

interface ConversationToSlackEntryProps { id: string, users: User[], teamId: string, identity: Identity }

export function userConversationToSlackEntry({
                                           id,
                                           users,
                                           teamId,
                                           identity
                                         }: ConversationToSlackEntryProps): SlackEntry {
  const otherUsers = users.filter((user) => user.name !== identity.name);
  const name = otherUsers
    .map((user) => user.name)
    .sort()
    .join(", ");
  const email = otherUsers
    .map((user) => user.email)
    .filter((email) => email !== undefined)
    .join(";");
  return {
    email,
    id: id,
    name,
    teamId: teamId,
    type: users.length === 1 ? "user": "channel",
  };
}
