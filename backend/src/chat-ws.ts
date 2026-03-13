// WebSocket room manager for chat
// Each chat room is identified by chatId
// Supported message types:
// Client → Server: { type: "message", content } | { type: "typing_start" } | { type: "typing_stop" } | { type: "read", messageId }
// Server → Client: { type: "message", message: MessagePayload } | { type: "typing", userId, userName, typing: boolean } | { type: "read", messageId, userId }

export type ChatWSClient = {
  ws: { send: (data: string) => void };
  userId: string;
  userName: string;
  userImage?: string;
  chatId: string;
};

export type MessagePayload = {
  id: string;
  content?: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
};

const chatRooms = new Map<string, Set<ChatWSClient>>();

export function joinChatRoom(chatId: string, client: ChatWSClient): void {
  if (!chatRooms.has(chatId)) chatRooms.set(chatId, new Set());
  chatRooms.get(chatId)!.add(client);
}

export function leaveChatRoom(chatId: string, client: ChatWSClient): void {
  const room = chatRooms.get(chatId);
  if (room) {
    room.delete(client);
    if (room.size === 0) chatRooms.delete(chatId);
  }
  // Broadcast typing stopped when user leaves
  broadcastToChatRoom(
    chatId,
    { type: "typing", userId: client.userId, userName: client.userName, typing: false },
    client
  );
}

export function broadcastToChatRoom(
  chatId: string,
  message: object,
  excludeClient?: ChatWSClient
): void {
  const room = chatRooms.get(chatId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const client of room) {
    if (client !== excludeClient) {
      try {
        client.ws.send(data);
      } catch {
        // ignore closed connections
      }
    }
  }
}

export function broadcastNewMessage(
  chatId: string,
  message: MessagePayload,
  senderClient?: ChatWSClient
): void {
  broadcastToChatRoom(chatId, { type: "message", message }, senderClient);
}

export function getOnlineUsersInChat(chatId: string): string[] {
  const room = chatRooms.get(chatId);
  if (!room) return [];
  return Array.from(room).map((c) => c.userId);
}
