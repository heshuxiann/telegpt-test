interface ChatProps {
  data: any;
  onResponse: (message: string) => void;
  onFinish?: () => void;
}
const chatAIGenerate = (props:ChatProps) => {
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
