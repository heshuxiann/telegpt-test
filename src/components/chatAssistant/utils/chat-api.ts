import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';

export const getUserInfo = () => {
  const global = getGlobal();
  const { currentUserId } = global;
  const user = selectUser(global, currentUserId!);
  const userName = getUserFullName(user);
  return {
    userId: currentUserId,
    userName,
  };
};

interface ChatProps {
  data: any;
  onResponse: (message: string) => void;
  onFinish?: () => void;
}
export const chatAIGenerate = (props: ChatProps) => {
  // `https://telegpt-three.vercel.app/generate?options=${JSON.stringify({ temperature: 0.1 })}`
  const { userId, userName } = getUserInfo();
  fetch('https://telegpt-three.vercel.app/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      userName,
      ...props.data,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      props.onResponse(res.text);
    });
};

export const chatAITranslate = (data: {
  langCode: string;
  text: string;
}): Promise<{ text: string }> => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const summaryMessage = (data: Object) => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const globalSummary = (data: Object) => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/global-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getActionItems = (data: Object) => {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/action-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getHitTools = (
  text: string,
  timeZone?: string,
): Promise<Array<any>> => {
  const { userId, userName } = getUserInfo();
  const params: any = {
    userId,
    userName,
    messages: [
      {
        id: uuidv4(),
        content: text,
        role: 'user',
      },
    ],
  };
  if (timeZone) {
    params.timeZone = timeZone;
  }
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/tool-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
      .then((res) => res.json())
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function imageAISummary(data: Object) {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/image-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function webPageAISummary(data: Object) {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/webpage-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function documentAISummary(data: Object) {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/document-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function audioAISummary(formData: FormData) {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/audio-summary', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function audioToText(formData: FormData): Promise<{ text: string }> {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/audio-to-text', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function mentionReply(data: Object) {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/mention-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function calendlyRanges(data: {
  calendlyUrl: string;
}): Promise<{ start: string; end: string }[]> {
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/calendly-ranges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        const times: { start: string; end: string }[] = [];
        if (res.data.days) {
          res.data.days.forEach((day: any) => {
            day.spots.forEach((spot: { start_time: string }) => {
              const start = new Date(spot.start_time);
              const end = new Date(start.getTime() + 30 * 60 * 1000);

              times.push({
                start: start.toISOString(),
                end: end.toISOString(),
              });
            });
          });
        }
        resolve(times);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function chatAIChatFolders(data: Object):Promise<{ text: string }> {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/calendly-ranges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function urgentMessageCheck(data:Object):Promise<any> {
  const { userId, userName } = getUserInfo();
  return new Promise((resolve, reject) => {
    fetch('https://telegpt-three.vercel.app/urgent-message-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        ...data,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
