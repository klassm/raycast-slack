import { keyBy, pickBy } from "lodash";
import { Conversation, loadConversationInfos } from "../slack/conversationInfo";
import { Credentials } from "../types/Credentials";
import { getCachedData, updateCache } from "../utils/cache";

interface ConversationCache {
  [conversationId: string]: Conversation;
}

export async function cachedConversations(
  conversationIds: string[],
  credentials: Credentials,
  teamId: string
): Promise<ConversationCache> {
  const cacheKey = `slack-conversations-${teamId}`;
  const cached = await getCachedData<ConversationCache>(cacheKey, async () => ({}), {
    expirationMillis: 1000 * 60 * 60 * 24 * 10,
  });

  const foundConversations = pickBy(cached, (value) => conversationIds.includes(value.id));

  const missingConversations = conversationIds.filter((id) => cached[id] === undefined);
  if (missingConversations.length === 0) {
    return foundConversations;
  }

  const newlyLoadedConversations = await loadConversationInfos(credentials, missingConversations);
  const indexedConversations = keyBy(newlyLoadedConversations, (user) => user.id);

  updateCache(cacheKey, { ...cached, ...indexedConversations });

  return { ...foundConversations, ...indexedConversations };
}
