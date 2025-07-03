import React, { useEffect, useState } from "react";
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
  let status: MessageStatus = "loading";
  let replys: any[] = [];
  try {
    content = JSON.parse(message.content);
    messageId = content?.messageId;
    status = content?.status;
    try {
      replys = JSON.parse(content?.replys?.replace(/'/g, '"')?.replace(/,\s+/g, ','));
    } catch (error) {
      // console.log("aiChatFoldersTask----replys", error);
    }
  } catch (error) {}

  const [disabled, setDisabled] = useState<boolean>(false)

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
      setDisabled(true)
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

  useEffect(()=>{
    setDisabled(content?.disabled)
  }, [message])

  //  console.log("aiChatFoldersTask----message", content);

  return (
    <div className="rounded-[16px] bg-[var(--color-background)] text-[var(--color-text)] mx-2 p-3 w-full text-[14px]">
      <div className="font-[600]">You were mentioned:</div>
      <div>"{content?.content}"</div>
      {status == "loading" ? (
        <ThinkingMessage />
      ) : status === "error" ? (
        <div className="rounded-[16px] bg-[#FFF9F9] text-[#000] p-3 text-[14px] border-[1px] border-[#FFC7C7]">
          {content?.errorMsg}
        </div>
      ) : (
        <>
          <div>Here are a few reply suggestions for you 👇</div>
          <div className="flex flex-col gap-[6px] mt-2">
            {replys?.map((reply: any, index: number) => {
              return (
                <div
                  className={buildClassName(
                    "bg-[var(--color-ai-room-mention-reply-bg)] rounded-[6px] p-[6px] ",
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
        </>
      )}
    </div>
  );
};

export default ReplyMentionMessage;
