import { getGlobal } from '../../../global';

import { SERVER_API_URL } from '../../../config';
import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';

export type GrammarlyCheckItem = {
  type?: string;
  description?: string;
  offset: number;
  length: number;
  originalText?: string;
  remove_segment: boolean;
  suggestions:string[];
};
type GrammarlyCheckResponse = {
  code:number;
  data:{
    errors:GrammarlyCheckItem[];
  };
};

function getUserInfo() {
  const global = getGlobal();
  const { currentUserId } = global;
  const user = selectUser(global, currentUserId!);
  const userName = getUserFullName(user);
  return {
    userId: currentUserId,
    userName,
  };
}
export const grammarlyCheck = (text:string):Promise<GrammarlyCheckResponse> => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/grammarly-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        userId,
        userName,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyShorten = (text:string):Promise<GrammarlyCheckResponse> => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/grammarly-shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        userId,
        userName,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyFormal = (text:string):Promise<GrammarlyCheckResponse> => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/grammarly-formal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        userId,
        userName,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyFriendly = (text:string):Promise<GrammarlyCheckResponse> => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/grammarly-friendly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        userId,
        userName,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyRephrase = (text:string):Promise<GrammarlyCheckResponse> => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/grammarly-rephrase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        userId,
        userName,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
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
