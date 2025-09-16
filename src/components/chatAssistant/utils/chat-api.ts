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
  // `${SERVER_API_URL}/generate?options=${JSON.stringify({ temperature: 0.1 })}`
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

export const chatAITranslate = (data: {
  langCode: string;
  text: string;
}): Promise<{ text: string }> => {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/translate`, {
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

export const summaryMessage = (data: object) => {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/summary`, {
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

export const globalSummary = (data: object) => {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/global-summary`, {
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

export const getActionItems = (data: object) => {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/action-items`, {
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
  const { userId, userName } = getCurrentUserInfo();
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
    fetch(`${SERVER_API_URL}/tool-check`, {
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
    TelegptFetch('/meeting-tool', 'POST', params)
      .then((res) => res.json()).then()
      .then((toolResults) => {
        resolve(toolResults);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function imageAISummary(data: object) {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/image-summary`, {
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

export function webPageAISummary(data: object) {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/webpage-summary`, {
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

export function documentAISummary(data: object) {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/document-summary`, {
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
  const { userId, userName } = getCurrentUserInfo();
  formData.append('userId', userId!);
  formData.append('userName', userName!);
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/audio-summary`, {
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
  const { userId, userName } = getCurrentUserInfo();
  formData.append('userId', userId!);
  formData.append('userName', userName!);
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/audio-to-text`, {
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

export function mentionReply(data: object) {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/mention-reply`, {
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
}): Promise<{ times: string[]; timeZone: string; email: string }> {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/calendly-ranges`, {
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

export function chatAIChatFolders(data: object): Promise<{ text: string }> {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/classify-generate`, {
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

export function urgentMessageCheck(data: object): Promise<any> {
  const { userId, userName } = getCurrentUserInfo();
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_API_URL}/urgent-message-check`, {
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
