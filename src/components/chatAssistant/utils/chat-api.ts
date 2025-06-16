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
