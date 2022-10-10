import { sortBy, sum, uniq } from "lodash";
import replaceSpecialCharacters from "replace-special-characters";
import { ConversationChannel, loadConversations } from "../slack/conversations";
import { Identity, loadIdentityCached } from "../slack/identity";
import { loadCachedUsers, User } from "../slack/users";
import { Credentials } from "../types/Credentials";
import { SlackEntry } from "../types/SlackEntry";
import { getCachedData } from "../utils/cache";
import { userConversationToSlackEntry } from "../utils/userConversationToSlackEntry";

interface ConversationWithUsers extends ConversationChannel {
  users: User[];
}

function searchScoreFor(queryParts: string[], conversation: ConversationWithUsers): number {
  const allKeywords = uniq(conversation.users.flatMap((user) => user.keywords));
  if (allKeywords.length === 0) {
    return 0;
  }
  const keywordScores = allKeywords.map((keyword) => {
    const part = queryParts.find((part) => keyword.includes(part));
    return part ? part.length / keyword.length : 0;
  });

  return sum(keywordScores) / allKeywords.length;
}

function search(query: string, data: ConversationWithUsers[]): ConversationWithUsers[] {
  const queryParts = replaceSpecialCharacters(query).toLowerCase().split(/[ -_]/);
  const withScore = data
    .map((entry) => ({
      ...entry,
      score: searchScoreFor(queryParts, entry),
    }))
    .filter((entry) => entry.score > 0);

  const sorted = sortBy(withScore, (entry) => entry.score).reverse();
  return sorted.slice(0, 20);
}

function toSlackEntry(conversation: ConversationWithUsers, identity: Identity): SlackEntry {
  return userConversationToSlackEntry({ ...conversation, teamId: conversation.context_team_id, identity });
}

async function enrichWithUsers(
  credentials: Credentials,
  teamId: string,
  conversations: { [id: string]: ConversationChannel }
): Promise<ConversationWithUsers[]> {
  const userIds = uniq(Object.values(conversations).flatMap((conversation) => conversation.members));
  const userCache = await loadCachedUsers(credentials, teamId, userIds);
  return Object.values(conversations).map((conversation) => {
    return {
      ...conversation,
      users: conversation.members.map((member) => userCache[member]),
    };
  });
}

export async function searchConversations(
  credentials: Credentials,
  teamId: string,
  query: string
): Promise<SlackEntry[]> {
  const data = await getCachedData(`slack-conversations-object-${teamId}`, async () => loadConversations(credentials), {
    expirationMillis: 10 * 60000,
  });

  const enrichedConversations = await enrichWithUsers(credentials, teamId, data);

  const identity = await loadIdentityCached(credentials, teamId);
  return search(query, enrichedConversations).map((conversation) => toSlackEntry(conversation, identity));
}
