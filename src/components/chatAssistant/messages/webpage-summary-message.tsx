import React from "react";
import { Message } from "ai";
import { ApiMessage } from "../../../api/types";

type IProps = {
  message: Message;
};

const WebPageSummaryMessage = (props: IProps) => {
  let content: any = {};
  let message: ApiMessage | undefined = undefined;
  let summaryInfo;
  try {
    content = JSON.parse(props?.message.content);
    message = content?.message;
    summaryInfo = JSON.parse(content?.summaryInfo);
  } catch (error) {}

  console.log("aiChatFoldersTask----content", content, summaryInfo);

  return (
    <div className="flex flex-col gap-2 px-3 text-[14px]">
      <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
        {message?.content?.webPage?.url}
      </div>
      <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)]">
        <div className="font-[600] text-[16px]">
          Summary of the Article: "{summaryInfo?.title}"
        </div>
        <div className="flex flex-col gap-[6px] mt-3">
          <div className="font-[600]">Key Highlights:</div>
          <div>
            {summaryInfo?.highlights?.map((item: any, index: number) => {
              return (
                <div className="flex flex-col">
                  <div className="flex flex-row items-center flex-wrap">
                    <span className="mr-[24px]">
                      {index + 1}. {item?.title}
                    </span>
                  </div>
                  <ul className="list-disc list-inside ml-3">
                    {item?.content?.map((contentItem: any) => {
                      return (
                        <li
                          role="button"
                          className="cursor-pointer break-word"
                        >
                          {contentItem}
                        </li>
                      );
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
