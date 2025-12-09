// Shared types for the backend
// This file can be expanded as the backend grows

export interface RoomInfo {
  roomId: string;
  clientCount: number;
}

export interface SignalingMessage {
  type: string;
  data: unknown;
}

