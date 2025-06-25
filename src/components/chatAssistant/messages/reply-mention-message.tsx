import React from "react";
import { getActions, getGlobal } from "../../../global";
import { Message } from "ai";
import { selectCurrentChat } from "../../../global/selectors";
import { ApiDraft } from "../../../api/types";
import { ChataiStores } from "../store";
import buildClassName from "../../../util/buildClassName";

type IProps = {
  message: Message;
};
const ReplyMentionMessage = (props: IProps) => {
  const { message } = props;
  let content: any = {};
  let messageId: number = 0;
  let disabled = false;
  try {
    content = JSON.parse(message.content);
    messageId = content?.messageId;
    disabled = content?.disabled;
  } catch (error) {}

  function onReplyClick(text: string) {
    if (disabled) return;
    const global = getGlobal();
    const { saveReplyDraft, sendMessage, clearDraft } = getActions();
    const currentChat = selectCurrentChat(global);
    if (currentChat && messageId) {
      const chatId = currentChat.id;
      const threadId = -1;
      saveReplyDraft({
        chatId,
        threadId,
        draft: {
          replyInfo: {
            type: "message",
            replyToMsgId: messageId,
            replyToPeerId: undefined,
          },
        } as ApiDraft,
        isLocalOnly: true,
      });
      sendMessage({
        messageList: {
          chatId,
          threadId,
          type: "thread",
        },
        text,
      });
      clearDraft({ chatId, isLocalOnly: true });
      // disable the reply button
      ChataiStores.message?.storeMessage({
        ...message,
        chatId,
        timestamp: new Date().getTime(),
        content: JSON.stringify({
          disabled: true,
          ...content,
        }),
      });
    }
  }

  return (
    <div className="rounded-[16px] bg-[var(--color-background)] text-[var(--color-text)] mx-2 p-3 w-full text-[14px]">
      <div className="font-[600]">You were mentioned:</div>
      <div>"{content?.content}"</div>
      <div>Here are a few reply suggestions for you 👇</div>
      <div className="flex flex-col gap-[6px] mt-2">
        {content?.replys?.map((reply: any, index: number) => {
          return (
            <div
              className={buildClassName(
                "bg-[#F4F4F4] rounded-[6px] p-[6px] ",
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:opacity-80"
              )}
              key={index}
              onClick={() => onReplyClick(reply)}
            >
              "{reply}"
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReplyMentionMessage;
