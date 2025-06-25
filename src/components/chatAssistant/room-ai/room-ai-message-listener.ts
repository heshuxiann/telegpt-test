import { v4 as uuidv4 } from 'uuid';
import { ApiMessage } from "../../../api/types"
import { getGlobal } from "../../../global"
import { chatAIGenerate, imageAISummary } from "../utils/chat-api"
import eventEmitter, { Actions } from '../lib/EventEmitter';
import type { StoreMessage } from '../store/messages-store';
import { ChataiStores } from "../store"
import { hasMessageText } from "../../../global/helpers"
import { formatJSONContent } from "../ai-chatfolders/util"


class RoomAIMessageListener {
  static get global() {
    return getGlobal();
  }

  public static messageListener(message: ApiMessage) {
    const hasTextContent = message && hasMessageText(message);
    const { webPage, photo, video, audio, voice, document } = message.content;
    if (message.isMentioned) {
      this.replyToMention(message)
    } else if (webPage) {

    } else if (photo) {
      this.analyzePhoto(message);
    } else if (video) {

    } else if (audio || voice) {

    } else if (document) {

    } else if (hasTextContent) {

    }

  }

  private static async replyToMention(message: ApiMessage) {
    chatAIGenerate({
      data: {
        messages: [
          {
            role: 'system',
            content: '你是一个多语种智能助手。接收用户消息后，自动识别其使用的语言，并用相同的语言进行自然、得体的回复。你应该理解消息的语境，确保回复简洁、友好且符合语言习惯。',
            id: '1',
          },
          {
            role: 'user',
            content: `请回复下面的消息: ${message.content.text?.text}, 并给出3个回复，以JSON数据进行返回`,
            id: '2',
          },
        ],
      },
      onResponse: (response) => {
        const content = {
          messageId: message.id,
          content: message.content.text?.text,
          replys: formatJSONContent(response)?.replies
        }
        const newMessage = {
          chatId: message.chatId,
          timestamp: new Date().getTime(),
          content: JSON.stringify(content),
          id: uuidv4(),
          createdAt: new Date(),
          role: 'assistant',
          annotations: [{
            type: 'room-ai-reply-mention',
          }],
        };
        ChataiStores.message?.storeMessage(newMessage as StoreMessage);
        eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
      },
      onFinish: () => {
        // eslint-disable-next-line no-console
        console.log('Finish');
      },
    });
  }

  private static analyzePhoto(message: ApiMessage) {
    debugger
    const image = message.content?.photo?.thumbnail?.dataUri
    if (!image) return
    imageAISummary(image).then((response: any)=>{
      const content = {
        message: message,
        summaryInfo: response?.text
      }
      const newMessage = {
        chatId: message.chatId,
        timestamp: new Date().getTime(),
        content: JSON.stringify(content),
        id: uuidv4(),
        createdAt: new Date(),
        role: 'assistant',
        annotations: [{
          type: 'room-ai-image-summary',
        }],
      };
      ChataiStores.message?.storeMessage(newMessage as StoreMessage);
      eventEmitter.emit(Actions.AddRoomAIMessage, newMessage);
    }).catch((err)=>{
      console.log('error', err)
    })
  }

}

export default RoomAIMessageListener;
