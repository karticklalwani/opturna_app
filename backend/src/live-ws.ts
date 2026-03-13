// WebSocket room manager for live streams
// Each stream has a room identified by streamId
// Messages: { type: "chat", content, userId, userName, userImage, timestamp }
// Messages: { type: "viewer_count", count }
// Messages: { type: "stream_ended" }

export type WSClient = {
  ws: { send: (data: string) => void };
  userId: string;
  userName: string;
  userImage?: string;
};

const rooms = new Map<string, Set<WSClient>>();

export function joinRoom(streamId: string, client: WSClient): void {
  if (!rooms.has(streamId)) rooms.set(streamId, new Set());
  rooms.get(streamId)!.add(client);
  broadcastViewerCount(streamId);
}

export function leaveRoom(streamId: string, client: WSClient): void {
  const room = rooms.get(streamId);
  if (room) {
    room.delete(client);
    if (room.size === 0) rooms.delete(streamId);
    else broadcastViewerCount(streamId);
  }
}

export function broadcastToRoom(
  streamId: string,
  message: object,
  excludeClient?: WSClient
): void {
  const room = rooms.get(streamId);
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

export function broadcastViewerCount(streamId: string): void {
  const room = rooms.get(streamId);
  const count = room?.size ?? 0;
  broadcastToRoom(streamId, { type: "viewer_count", count });
}

export function getRoomSize(streamId: string): number {
  return rooms.get(streamId)?.size ?? 0;
}

export function endStream(streamId: string): void {
  broadcastToRoom(streamId, { type: "stream_ended" });
  rooms.delete(streamId);
}
