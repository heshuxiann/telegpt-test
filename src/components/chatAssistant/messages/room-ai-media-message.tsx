import React from "react";
import { Message } from "ai";
import { SVGProps } from "react";
import { ThinkingMessage } from "../message";
import buildClassName from "../../../util/buildClassName";
import { ApiMediaFormat, ApiMessage } from "../../../api/types";
import { getPhotoMediaHash, isOwnMessage } from "../../../global/helpers";
import { getActions, getGlobal } from "../../../global";
import { selectTheme } from "../../../global/selectors";
import { useWaveformCanvas } from "../../common/Audio";
import useMedia from "../hook/useMedia";
import { MediaViewerOrigin } from "../../../types";
import SerenaPath from "../../chatAssistant/assets/serena.png";
import { checkIsUrl } from "../utils/ai-analyse-message";

type IProps = {
  message: Message;
};

export type MessageStatus = "loading" | "success" | "error";

const RoomAIMediaMessage: React.FC<IProps> = (props) => {
  const global = getGlobal();
  const theme = selectTheme(global);

  let content: any = {};
  let message: ApiMessage | undefined = undefined;
  let summaryInfo: any = undefined;
  let isAuto: boolean = false;
  let status: MessageStatus = "loading";
  try {
    content = JSON.parse(props?.message.content);
    message = content?.message;
    try {
      summaryInfo = JSON.parse(content?.summaryInfo);
    } catch (error) {}
    isAuto = content?.isAuto;
    status = content?.status;
  } catch (error) {}

  const isOwn = message ? isOwnMessage(message) : false;
  const waveformCanvasRef = message?.content?.voice
    ? useWaveformCanvas(theme, message?.content?.voice, 1, isOwn)
    : undefined;

  const imgBlobUrl = message?.content?.photo
    ? useMedia(
        message?.content?.photo
          ? getPhotoMediaHash(message?.content?.photo, "inline")
          : undefined,
        false,
        ApiMediaFormat.BlobUrl
      )
    : undefined;
  const fullMediaData = message?.content?.photo?.blobUrl || imgBlobUrl;
  const forcedWidth = message?.content?.photo?.thumbnail?.width;
  const withBlurredBackground = Boolean(forcedWidth);

  function getTitle() {
    if (!message) return "";

    const { webPage, photo, document, audio, voice } = message?.content;
    const isUrl = checkIsUrl(message?.content?.text?.text);
    if (webPage || isUrl) {
      return "Summarize this webpage";
    } else if (photo) {
      return "Summarize this image";
    } else if (document) {
      return "Summarize this document";
    } else if (audio) {
      return "Summarize this audio";
    } else if (voice) {
      return "Summarize this voice";
    }
  }

  function onPreviewClick() {
    const { openMediaViewer } = getActions();

    openMediaViewer({
      chatId: message?.chatId,
      threadId: -1,
      messageId: message?.id,
      origin: MediaViewerOrigin.Inline,
      withDynamicLoading: true,
    });
  }

  function renderMessageContent() {
    if (!message) return "";

    const { webPage, photo, document, audio, voice } = message?.content;
    const isUrl = checkIsUrl(message?.content?.text?.text);
    if (webPage || isUrl) {
      return (
        <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
          <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
            {webPage
              ? message?.content?.webPage?.url
              : message?.content?.text?.text}
          </div>
        </div>
      );
    } else if (photo) {
      return (
        fullMediaData && (
          <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
            <img
              src={fullMediaData}
              className={buildClassName(
                "full-media cursor-pointer",
                withBlurredBackground && "with-blurred-bg"
              )}
              alt=""
              style={{ width: `${forcedWidth ?? 0}px` } as React.CSSProperties}
              onClick={onPreviewClick}
            />
          </div>
        )
      );
    } else if (document) {
      return (
        <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
          <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
            {message?.content.document?.fileName}
          </div>
        </div>
      );
    } else if (audio) {
      return (
        <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
          <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
            {message?.content.audio?.fileName}
          </div>
        </div>
      );
    } else if (voice) {
      return (
        <div className={buildClassName("flex", !isAuto ? "justify-end" : "")}>
          <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)] break-all">
            {message?.content?.voice && (
              <div className="waveform-wrapper">
                <div className="waveform" draggable={false}>
                  <canvas ref={waveformCanvasRef} />
                </div>
              </div>
            )}
            {message?.content?.audio && (
              <p
                className="title"
                dir="auto"
                title={message?.content?.audio?.title}
              >
                {message?.content?.audio?.title}
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  function renderSummary() {
    if (!message) return "";

    const { webPage, photo } = message?.content;
    const isUrl = checkIsUrl(message?.content?.text?.text);
    if (webPage || isUrl) {
      return summaryInfo?.title ? (
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
      ) : (
        <NoSummaryContent content="website page" />
      );
    } else if (photo) {
      return (
        <div className="rounded-[16px] bg-[var(--color-background)] text-[var(--color-text)] p-3 text-[14px]">
          {isAuto ? (
            <div className="font-[600]">Image summarize</div>
          ) : (
            <div className="flex items-center gap-2">
              <img src={SerenaPath} className="w-[18px] h-[18px]" />
              Serena AI
            </div>
          )}
          <div className="flex flex-col gap-[6px] mt-2">
            {summaryInfo?.text}
          </div>
        </div>
      );
    } else {
      return (
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
      );
    }
  }

  console.log("aiChatFoldersTask----message", content);

  return (
    <div className="flex flex-col gap-2 px-3 text-[14px]">
      {!isAuto && (
        <div className="text-right">
          <AIRoomBubble>{getTitle()}</AIRoomBubble>
        </div>
      )}
      {renderMessageContent()}
      {status === "loading" ? (
        <ThinkingMessage />
      ) : status === "error" ? (
        <div className="rounded-[16px] bg-[#FFF9F9] text-[#000] p-3 text-[14px] border-[1px] border-[#FFC7C7]">
          {content?.errorMsg}
        </div>
      ) : (
        renderSummary()
      )}
    </div>
  );
};

export default RoomAIMediaMessage;

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

export const AppendixIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={9} height={20} {...props}>
    <defs>
      <filter
        id="a"
        width="200%"
        height="141.2%"
        x="-50%"
        y="-14.7%"
        filterUnits="objectBoundingBox"
      >
        <feOffset dy={1} in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur
          in="shadowOffsetOuter1"
          result="shadowBlurOuter1"
          stdDeviation={1}
        />
        <feColorMatrix
          in="shadowBlurOuter1"
          values="0 0 0 0 0.0621962482 0 0 0 0 0.138574144 0 0 0 0 0.185037364 0 0 0 0.15 0"
        />
      </filter>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path
        fill="currentColor"
        d="M6 17H0V0c.193 2.84.876 5.767 2.05 8.782.904 2.325 2.446 4.485 4.625 6.48A1 1 0 0 1 6 17z"
        filter="url(#a)"
      />
      <path
        fill="currentColor"
        d="M6 17H0V0c.193 2.84.876 5.767 2.05 8.782.904 2.325 2.446 4.485 4.625 6.48A1 1 0 0 1 6 17z"
      />
    </g>
  </svg>
);

const NoSummaryContent = ({ content }: { content: string }) => {
  return (
    <div className="rounded-[16px] bg-[var(--color-background)] p-3 text-[var(--color-text)]">
      I couldn’t find any accessible content from the {content} you provided. It
      appears the search query didn’t return any results. Could you please paste
      the text you want summarized? That way, I can give you a clear and
      accurate summary!
    </div>
  );
};
