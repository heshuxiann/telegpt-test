export interface TgStoreMessage {
  chatId: string;
  sender: string;
  messageId: number;
  messageContent: string;
  chatType: 'private' | 'group';
  timestamp: number;
}
