/* eslint-disable no-cond-assign */
/* eslint-disable no-console */
interface Message {
  id: string;
  content: string;
}
interface ChatProps {
  data: any;
  onResponse: (message: Message) => void;
  onFinish: () => void;
}
class AiSdkService {
  private url: string;

  private message: string;

  constructor(url: string) {
    this.url = url;
    this.message = ''; // Used to accumulate stream text
  }

  private static filterContent(chunk:string) {
    const regex = /0:"(.*?)"(?=\n|$)/g;
    let match;
    const results = [];

    while ((match = regex.exec(chunk)) && match) {
      results.push(match?.[1]);
    }
    // 拼接所有内容
    const concatenated = results.join('');
    return concatenated;
  }

  private static filterMessageId(chunk:string) {
    const regex = /f:(.*?)(?=\n|$)/g;
    let match;
    const results = [];

    while ((match = regex.exec(chunk)) && match) {
      results.push(match?.[1]);
    }
    // 拼接所有内容
    const concatenated = results.join('');
    return concatenated;
  }

  // To handle streaming data with mixed JSON and text
  public async useChat(props:ChatProps): Promise<void> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(props.data),
      });

      // Check for successful response
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const decoder = new TextDecoder();
      const message: Message = { id: '', content: '' };
      // Read the stream as text chunks
      const processStream = async () => {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream finished');
          props.onFinish();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (chunk.startsWith('f:')) {
          const idString = AiSdkService.filterMessageId(chunk);
          if (idString) {
            message.id = JSON.parse(idString)?.messageId;
          }
          message.content += AiSdkService.filterContent(chunk);
        //   message.id = JSON.parse(chunk.substring(2).trim());
        }
        if (chunk.startsWith('0:')) {
        //   console.log(chunk.substring(2), '--------chunk');
          message.content += AiSdkService.filterContent(chunk);
        }
        props.onResponse(message);
        // Continue reading the next chunk
        processStream();
      };

      // Start processing the stream
      processStream();
    } catch (error) {
      console.error('Error fetching stream data:', error);
    }
  }
}

// const aiSdkService = new AiSdkService('http://10.1.4.136:3000/chat');
// const aiSdkService = new AiSdkService('https://ai-api-sdm.vercel.app/chat');
const aiSdkService = new AiSdkService('https://ai-api-sdm.vercel.app/generate');
// const aiSdkService = new AiSdkService('https://429d-35-221-126-189.ngrok-free.app/chat');

export default aiSdkService;
