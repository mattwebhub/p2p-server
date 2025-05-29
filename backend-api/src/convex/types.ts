export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface User {
  uid: string;
  handle: string;
  created: number;
}

export interface Room {
  hostUid: string;
  players: string[];
  status: RoomStatus;
  created: number;
}

export interface Hash {
  roomId: string;
  tick: number;
  hash: string;
  timestamp: number;
}
