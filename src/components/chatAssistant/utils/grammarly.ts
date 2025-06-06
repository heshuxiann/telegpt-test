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
export const grammarlyCheck = (text:string):Promise<GrammarlyCheckResponse> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/grammarly-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyShorten = (text:string):Promise<GrammarlyCheckResponse> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/grammarly-shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyFormal = (text:string):Promise<GrammarlyCheckResponse> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/grammarly-formal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyFriendly = (text:string):Promise<GrammarlyCheckResponse> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/grammarly-friendly', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    }).then((response) => response.json())
      .then((data) => resolve(data as GrammarlyCheckResponse))
      .catch((err) => {
        reject(err);
      });
  });
};
export const grammarlyRephrase = (text:string):Promise<GrammarlyCheckResponse> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/grammarly-rephrase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
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
