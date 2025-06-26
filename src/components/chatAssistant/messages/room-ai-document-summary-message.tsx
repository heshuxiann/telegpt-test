import React from "react";
import { Message } from "ai";
import { ApiMessage } from "../../../api/types";
import { AppendixIcon } from "./room-ai-image-summary-message";
import buildClassName from "../../../util/buildClassName";
import { AIRoomBubble } from "./room-ai-webpage-summary-message";

type IProps = {
  message: Message;
};

const DocumentSummaryMessage = (props: IProps) => {
  let content: any = {};
  let message: ApiMessage | undefined = undefined;
  let isAuto: boolean = false;
  let summaryInfo;
  try {
    content = JSON.parse(props?.message.content);
    message = content?.message;
    isAuto = content?.isAuto;
    summaryInfo = JSON.parse(content?.summaryInfo);
  } catch (error) {
    summaryInfo = [
      {
        title: "",
        content: [content?.summaryInfo],
      },
    ];
  }

  return (
    <div className="flex flex-col gap-2 px-3 text-[14px]">
      {!isAuto && (
        <div className="text-right">
          <AIRoomBubble>Summarize this document</AIRoomBubble>
        </div>
      )}
      <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
        <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
          {message?.content.document?.fileName}
        </div>
      </div>
      <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)]">
        <div className="font-[600] text-[16px]">Key Highlights:</div>
        <div className="flex flex-col mt-2">
          {summaryInfo?.map((item: any) => {
            return (
              <div className="flex flex-col">
                <div className="flex flex-row items-center flex-wrap">
                  <span className="mr-[24px] font-[600]">{item?.title}</span>
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
  );
};

export default DocumentSummaryMessage;
