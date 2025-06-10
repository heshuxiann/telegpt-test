interface ChatProps {
  data: any;
  onResponse: (message: string) => void;
  onFinish?: () => void;
}
const chatAIGenerate = (props:ChatProps) => {
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

export default chatAIGenerate;
