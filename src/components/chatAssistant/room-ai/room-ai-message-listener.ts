import type { ApiMessage } from '../../../api/types';

import {
  audioSummary, checkIsUrl, documentSummary, photoSummary, replyToMention, videoSummary, voiceToAudioSummary, webPageSummary,
} from '../utils/ai-analyse-message';

class RoomAIMessageListener {
  public static messageListener(message: ApiMessage) {
    const {
      webPage, photo, video, audio, voice, document, text,
    } = message.content;
    const isUrl = checkIsUrl(text?.text);

    if (message.isMentioned) {
      replyToMention(message, true);
    } else if ((webPage && !text?.text) || isUrl) {
      webPageSummary(message, true);
    } else if (photo) {
      photoSummary(message, true);
    } else if (voice) {
      voiceToAudioSummary(message, true);
    } else if (audio) {
      audioSummary(message, true);
    } else if (document) {
      documentSummary(message, true);
    } else if (video) {
      videoSummary(message, true);
    }
  }
}

export default RoomAIMessageListener;
