import React, { SVGProps } from "react";
import { Message } from "ai";
import { MediaViewerOrigin, ThemeKey } from "../../../types";
import { ApiMediaFormat, ApiMessage, ApiPhoto } from "../../../api/types";
import { getPhotoMediaHash } from "../../../global/helpers";
import buildClassName from "../../../util/buildClassName";
import useMedia from "../hook/useMedia";
import { getActions } from "../../../global";
import SerenaPath from "../../chatAssistant/assets/serena.png";

type IProps = {
  theme?: ThemeKey;
  message: Message;
};
const ImageSummaryMessage = (props: IProps) => {
  let content: any = {};
  let message: ApiMessage | undefined = undefined;
  let photo: ApiPhoto | undefined = undefined;
  let isAuto: boolean = false;
  try {
    content = JSON.parse(props?.message.content);
    message = content?.message;
    photo = message?.content?.photo;
    isAuto = content?.isAuto;
  } catch (error) {}

  const imgBlobUrl = useMedia(
    photo ? getPhotoMediaHash(photo, "inline") : undefined,
    false,
    ApiMediaFormat.BlobUrl
  );
  const fullMediaData = photo?.blobUrl || imgBlobUrl;
  const forcedWidth = photo?.thumbnail?.width;
  const withBlurredBackground = Boolean(forcedWidth);

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

  return (
    <div className="flex flex-col gap-2 px-3">
      {!isAuto && (
        <div className="text-right">
          <div className="bg-[#E5D9FF] py-2 px-3 rounded-t-[16px] rounded-bl-[16px] text-right inline-flex relative">
            Summarize this image
            <div className="absolute bottom-[-2px] right-[-9px] text-[#E5D9FF]">
              <AppendixIcon />
            </div>
          </div>
        </div>
      )}
      {fullMediaData && (
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
      )}
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
          {content?.summaryInfo}
        </div>
      </div>
    </div>
  );
};

export default ImageSummaryMessage;

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
