import type { ConversationPublic, StorySummaryPublic } from "../client"

export function organizeStoryPaths(conversations: ConversationPublic[], memories: StorySummaryPublic[]) {
  const completedConversationIds = new Set(memories.map((memory) => memory.conversation_id))
  const byId = new Map(conversations.map((conversation) => [conversation.id, conversation]))
  const memoryByConversationId = new Map(memories.map((memory) => [memory.conversation_id, memory]))
  const available = conversations.filter((conversation) => !completedConversationIds.has(conversation.id))
  const newestFirst = (a: ConversationPublic, b: ConversationPublic) =>
    b.created_at.localeCompare(a.created_at) || b.id - a.id
  const inProgress = available
    .filter((conversation) => conversation.status === "active" || conversation.status === "ready_for_summary")
    .sort(newestFirst)
  // Follow-up conversation branches are no longer surfaced in the Night Sky.
  // AI suggestions now appear only while creating a constellation.
  const suggested: ConversationPublic[] = []
  const sourceTitle = (conversation: ConversationPublic) => {
    const parentId = conversation.parent_conversation_id
    if (parentId == null) return null
    const memoryTitle = memoryByConversationId.get(parentId)?.title?.trim()
    return memoryTitle || byId.get(parentId)?.node_title?.trim() || null
  }

  return { inProgress, suggested, sourceTitle, memoryByConversationId, byId }
}
