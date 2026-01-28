export enum AIMessageType {
  GlobalSummary = "global-summary",
  UrgentCheck = "urgent-message-check",
  GroupSearch = "group-search",
  UserSearch = "user-search",
  GoogleAuth = "google-auth",
  GoogleEventInsert = "google-event-insert",
  GoogleEventDetail = "google-event-detail",
  GoogleMeetTimeConfirm = "google-meet-time-confirm",
  GoogleMeetMention = "google-meet-mention",
  GoogleMeetInformationSuggest = "google-meet-information-suggest",
  RoomSummary = "room-summary",
  RoomActions = "room-actions",
  MeetingIntroduce = "global-meeting-introduce",
  SummaryIntroduce = "global-summary-introduce",
  TranslationIntroduce = "global-translation-introduce",
  ActionsIntroduce = "global-actions-introduce",
  GlobalIntroduce = "global-introduce",
  RoomAIDescription = "room-ai-description",
  AISearchSugesstion = "ai-search-sugesstion",
  AIReplyMention = "room-ai-reply-mention",
  AIMediaSummary = "room-ai-media-summary",
  UserPortrait = "user-portrait",
  UpgradeTip = "upgrade-tip",
  Default = "default",
}

export interface Message {
  id: string;
  createdAt?: Date;
  content: string;
  timestamp?: number;
  role: "system" | "user" | "assistant" | "data" | "teleai-system";
  type: AIMessageType;
}

// 聊天状态类型，替代 UseChatHelpers['status']
export type ChatStatus = "ready" | "streaming" | "error" | "submitted";
