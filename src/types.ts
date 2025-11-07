export interface User {
  PK: string;
  name: string;
  role: "user" | "guest";
}

export interface Message {
  senderId: string;
  senderName?: string;
  receiverId?: string;
  text: string;
  timestamp: number;
}

export interface Channel {
  PK: string;
  SK?: string;
  name: string;
  isPrivate?: boolean;
}
