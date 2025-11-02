export interface User {
  PK: string;
  name: string;
}

export interface Message {
  senderId: string;
  receiverId?: string;
  text: string;
  timestamp: number;
}

export interface Channel {
  PK: string;
  name: string;
}
