import { ApiMessage } from "../../../api/types";
import { documentSummary, photoSummary, replyToMention, voiceSummary, webPageSummary } from "../utils/ai-analyse-message"

class RoomAIMessageListener {
  public static messageListener(message: ApiMessage) {
    const { webPage, photo, video, audio, voice, document } = message.content;
    if (message.isMentioned) {
      replyToMention(message, true);
    } else if (webPage) {
      webPageSummary(message, true);
    } else if (photo) {
      // photoSummary(message, true);
    } else if (video) {

    } else if (audio || voice) {
      voiceSummary(message, true)
    } else if (document) {
      documentSummary(message, true);
    }
  }
}

export default RoomAIMessageListener;
