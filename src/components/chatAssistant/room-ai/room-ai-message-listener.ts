import { ApiMessage } from "../../../api/types";
import { audioSummary, checkIsUrl, documentSummary, photoSummary, replyToMention, voiceSummary, webPageSummary } from "../utils/ai-analyse-message"

class RoomAIMessageListener {
  public static messageListener(message: ApiMessage) {
    const { webPage, photo, video, audio, voice, document, text } = message.content;
    const isUrl = checkIsUrl(text?.text)
    if (message.isMentioned) {
      replyToMention(message, true);
    } else if (webPage || isUrl) {
      webPageSummary(message, true);
    } else if (photo) {
      // photoSummary(message, true);
    } else if (voice) {
      voiceSummary(message, true)
    } else if (audio) {
      audioSummary(message, true)
    } else if (document) {
      documentSummary(message, true);
    }
  }
}

export default RoomAIMessageListener;
