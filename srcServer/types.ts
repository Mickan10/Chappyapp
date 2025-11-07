export interface User {
  PK: string;
  SK?: string;
  email: string;
  name: string;
  password: string;
  role: "user" | "guest",
}

export interface Message {
  senderId: string;
  senderName: string;
  receiverId?: string;
  text: string;
  timestamp: number;
}

export interface Channel {
  PK: string;               
  SK: string;              
  name: string;
  isPrivate?: boolean;
}

export interface DecodedToken {
  userId: string;
  name: string;
  email?: string;
  role: "user" | "guest";
  iat?: number;
  exp?: number;
}