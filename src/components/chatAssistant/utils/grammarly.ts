import { TelegptFetch } from './telegpt-fetch';

export type GrammarlyCheckItem = {
  type?: string;
  description?: string;
  offset: number;
  length: number;
  originalText?: string;
  remove_segment: boolean;
  suggestions: string[];
};

export const grammarlyCheck = (text: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/grammarly-check', 'POST', JSON.stringify({ text }))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyShorten = (text: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/grammarly-shorten', 'POST', JSON.stringify({ text }))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyFormal = (text: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/grammarly-formal', 'POST', JSON.stringify({ text }))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyFriendly = (text: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/grammarly-friendly', 'POST', JSON.stringify({ text }))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyRephrase = (text: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/grammarly-rephrase', 'POST', JSON.stringify({ text }))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function getCorrectedText(text: string, errors: GrammarlyCheckItem[]): string {
  if (!errors.length) return text;

  // 从后往前替换，避免索引错乱
  const sorted = [...errors].sort((a, b) => b.offset - a.offset);

  for (const { offset, length, suggestions } of sorted) {
    const suggestion = suggestions[0] || '';
    text = text.slice(0, offset) + suggestion + text.slice(offset + length);
  }

  return text;
}
