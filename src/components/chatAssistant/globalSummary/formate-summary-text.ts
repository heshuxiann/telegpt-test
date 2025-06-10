/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import { validateAndFixJsonStructure } from '../utils/util';

export interface ISummaryInfo {
  summaryMessageCount: number;
  summaryStartTime: number;
  summaryEndTime: number;
  summaryChatIds: Array<string>;
}

export interface ISummaryTopicItem {
  title: string;
  summaryChatIds: Array<string>;
  summaryItems: Array<{
    subtitle: string;
    relevantMessages: Array<{
      chatId: string;
      messageIds: Array<number>;
    }>;
  }>;
}

export interface ISummaryPendingItem {
  chatId: string;
  chatTitle: string;
  summary: string;
  relevantMessageIds: number[];
}
export interface ISummaryGarbageItem {
  chatId: string;
  chatTitle: string;
  summary: string;
  level: 'high' | 'low';
  relevantMessageIds: number[];
}
const extractContent = (content: string, codeId: string):
ISummaryTopicItem[] | ISummaryPendingItem[] | ISummaryGarbageItem[] | ISummaryTopicItem[] | null => {
  const regex = new RegExp(`<!--\\s*json-start:\\s*${codeId}\\s*-->([\\s\\S]*?)<!--\\s*json-end\\s*-->`, 's');
  const match = content.match(regex);
  if (match) {
    try {
      const result = validateAndFixJsonStructure(match[1].trim());
      if (result.valid) {
        if (result.fixedJson) {
          return JSON.parse(result.fixedJson);
        } else {
          console.error('json parse error', result.error);
        }
      } else {
        console.error('json parse error', result.error);
      }
    } catch (error) {
      console.error('json parse error', error);
      return null;
    }
  }
  return null;
};

export const formatSummaryText = (content: string): {
  mainTopic: ISummaryTopicItem[] | null;
  pendingMatters: ISummaryPendingItem[] | null;
  garbageMessage: ISummaryGarbageItem[] | null;
  customizationTopic: ISummaryTopicItem[] | null;
} | null => {
  const mainTopic = extractContent(content, 'main-topic');
  const pendingMatters = extractContent(content, 'pending-matters');
  const garbageMessage = extractContent(content, 'garbage-message');
  const customizationTopic = extractContent(content, 'customization-topic');
  if (mainTopic || pendingMatters || garbageMessage || customizationTopic) {
    return {
      mainTopic: mainTopic as ISummaryTopicItem[] | null,
      pendingMatters: pendingMatters as ISummaryPendingItem[] | null,
      garbageMessage: garbageMessage as ISummaryGarbageItem[] | null,
      customizationTopic: customizationTopic as ISummaryTopicItem[] | null,
    };
  }
  return null;
};
