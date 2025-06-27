import React from "react";
import { getActions, getGlobal } from "../../../global";
import { Message } from "ai";
import { selectCurrentChat } from "../../../global/selectors";
import { ApiDraft } from "../../../api/types";
import { ChataiStores } from "../store";
import buildClassName from "../../../util/buildClassName";
import { MessageStatus } from "./room-ai-media-message";
import { ThinkingMessage } from "../message";

type IProps = {
  message: Message;
};
const ReplyMentionMessage = (props: IProps) => {
  const { message } = props;
  let content: any = {};
  let messageId: number = 0;
  let disabled = false;
  let status: MessageStatus = "loading";
  try {
    content = JSON.parse(message.content);
    messageId = content?.messageId;
    disabled = content?.disabled;
    status = content?.status;
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
      {status == "loading" ? (
        <ThinkingMessage />
      ) : status === "error" ? (
        <div className="rounded-[16px] bg-[#FFF9F9] text-[var(--color-text)] p-3 text-[14px] border-[1px] border-[#FFC7C7]">
          {content?.errorMsg}
        </div>
      ) : (
        <>
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
                  onClick={() => onReplyClick(reply?.reply)}
                >
                  "{reply}"
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ReplyMentionMessage;
