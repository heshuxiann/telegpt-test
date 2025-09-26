import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import { SERVER_API_URL } from '../../../config';
import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';
import { TelegptFetch } from './telegpt-fetch';
export const getCurrentUserInfo = () => {
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
  const { userId, userName } = getCurrentUserInfo();
  fetch(`${SERVER_API_URL}/generate`, {
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

export const autoReply = (data: {
  message: string;
  message_id?: number;
}): Promise<{ data: { reply: string; message_id?: number } }> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/auto-reply', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const chatAITranslate = (data: {
  langCode: string;
  text: string;
}): Promise<{ text: string }> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/translate', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const summaryMessage = (data: object) => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/summary', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const globalSummary = (data: object) => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/global-summary', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getActionItems = (data: object) => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/action-items', 'POST', JSON.stringify(data))
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
  const params = {
    text,
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return new Promise((resolve, reject) => {
    TelegptFetch('/tool-check', 'POST', JSON.stringify(params))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const getHitToolsForMeeting = (text: string): Promise<Array<any>> => {
  const params = {
    messages: [
      {
        id: uuidv4(),
        content: text,
        role: 'user',
      },
    ],
  };
  return new Promise((resolve, reject) => {
    TelegptFetch('/meeting-tool', 'POST', JSON.stringify(params))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function imageAISummary(data: object) {
  return new Promise((resolve, reject) => {
    TelegptFetch('/image-summary', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function webPageAISummary(data: object) {
  return new Promise((resolve, reject) => {
    TelegptFetch('/webpage-summary', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function documentAISummary(data: object) {
  return new Promise((resolve, reject) => {
    TelegptFetch('/document-summary', 'POST', JSON.stringify(data))
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
    TelegptFetch('/audio-summary', 'POST', formData, 'multipart/form-data')
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
    TelegptFetch('/audio-to-text', 'POST', formData, 'multipart/form-data')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function mentionReply(data: object) {
  return new Promise((resolve, reject) => {
    TelegptFetch('/mention-reply', 'POST', JSON.stringify(data))
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
}): Promise<{ times: string[]; timeZone: string; email: string }> {
  return new Promise((resolve, reject) => {
    TelegptFetch('/calendly-ranges', 'POST', JSON.stringify(data))
      .then((res) => {
        const times: string[] = [];
        const timeZone = res.data.availability_timezone;
        const email = res.data.current_user.email;
        if (res.data.days) {
          res.data.days.forEach((day: any) => {
            day.spots.forEach((spot: { start_time: string }) => {
              const start = new Date(spot.start_time);
              times.push(start.toISOString());
            });
          });
        }
        resolve({
          times,
          timeZone,
          email,
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function chatAIUserTags(data: object): Promise<any> {
  return new Promise((resolve, reject) => {
    TelegptFetch('/generate-tags', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function chatAIUserActivities(data: object): Promise<any> {
  return new Promise((resolve, reject) => {
    TelegptFetch('/generate-user-activities', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function chatAIChatFolders(data: object): Promise<{ text: string }> {
  return new Promise((resolve, reject) => {
    TelegptFetch('/classify-generate', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function urgentMessageCheck(data: object): Promise<any> {
  return new Promise((resolve, reject) => {
    TelegptFetch('/urgent-message-check', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export const translateTextByTencentApi = (
  data: object,
): Promise<Array<string>> => {
  return new Promise((resolve, reject) => {
    TelegptFetch('/tencent-translate', 'POST', JSON.stringify(data))
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export const urgentVoiceCall = (
  phone: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    TelegptFetch(`/voice-call?phoneNumber=${phone}`, 'GET')
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
