import React from "react";
import { Message } from "ai";
import { ApiMessage } from "../../../api/types";
import { AppendixIcon } from "./room-ai-image-summary-message";
import buildClassName from "../../../util/buildClassName";

type IProps = {
  message: Message;
};

const WebPageSummaryMessage = (props: IProps) => {
  let content: any = {};
  let message: ApiMessage | undefined = undefined;
  let summaryInfo;
  let isAuto: boolean = false;
  try {
    content = JSON.parse(props?.message.content);
    message = content?.message;
    summaryInfo = JSON.parse(content?.summaryInfo);
    isAuto = content?.isAuto;
  } catch (error) {}

  return (
    <div className="flex flex-col gap-2 px-3 text-[14px]">
      {!isAuto && (
        <div className="text-right">
          <AIRoomBubble>Summarize this webpage</AIRoomBubble>
        </div>
      )}
      <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
        <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
          {message?.content?.webPage?.url}
        </div>
      </div>
      <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)]">
        <div className="font-[600] text-[16px]">
          Summary of the Article: "{summaryInfo?.title}"
        </div>
        <div className="flex flex-col gap-[6px] mt-3">
          <div className="font-[600]">Key Highlights:</div>
          <div className="flex flex-col">
            {summaryInfo?.highlights?.map((item: any, index: number) => {
              return (
                <div className="flex flex-col">
                  <div className="flex flex-row items-center flex-wrap">
                    <span className="mr-[24px]">
                      {index + 1}. {item?.title}
                    </span>
                  </div>
                  <ul className="list-disc list-inside ml-3 mb-1">
                    {item?.content?.map((contentItem: any) => {
                      return <li className="break-word">{contentItem}</li>;
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebPageSummaryMessage;

export const AIRoomBubble = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-[var(--color-ai-room-bubble-bg)] py-2 px-3 rounded-t-[16px] rounded-bl-[16px] text-right inline-flex relative">
      {children}
      <div className="absolute bottom-[-3px] right-[-9px] text-[var(--color-ai-room-bubble-bg)]">
        <AppendixIcon />
      </div>
    </div>
  );
};
