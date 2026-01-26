export interface McpToolGetMessage {
  action: 'get_messages';
  params: {
    chatId: string;
    startTime: string;
    endTime: string;
    limit: number;
    senderIds: string;
  };
}
