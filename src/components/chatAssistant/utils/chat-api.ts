import { v4 as uuidv4 } from 'uuid';

interface ChatProps {
  data: any;
  onResponse: (message: string) => void;
  onFinish?: () => void;
}
export const chatAIGenerate = (props:ChatProps) => {
  // `https://telegpt-three.vercel.app/generate?options=${JSON.stringify({ temperature: 0.1 })}`
  fetch('https://telegpt-three.vercel.app/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(props.data),
  }).then((res) => res.json())
    .then((res) => {
      props.onResponse(res.text);
    });
};

export const chatAITranslate = (data:{ langCode:string; text:string }):Promise<{ text:string } > => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const summaryMessage = (data:Object) => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getActionItems = (data:Object) => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/action-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getHitTools = (text:string):Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/tool-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          id: uuidv4(),
          content: text,
          role: 'user',
        }],
      }),
    }).then((res) => res.json())
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function imageAISummary(imageBase64:string) {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/image-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function webPageAISummary(url:string) {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/webpage-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function documentAISummary(content:string) {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/document-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
  });
}

export function audioAISummary(content:string) {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/audio-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
  });
}

export const translateTextByTencentApi = (data:Object):Promise<Array<string>> => {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/tencent-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function audioToText(formData: FormData):Promise<{ text:string }> {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/audio-to-text', {
      method: 'POST',
      body: formData,
    }).then((res) => res.json())
      .then((res) => {
        resolve(res);
      }).catch((err) => {
        reject(err);
      });
  });
}
