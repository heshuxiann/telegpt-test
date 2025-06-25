import React from 'react';
import { Message } from "ai";
import { MediaViewerOrigin, ThemeKey } from "../../../types"
import { ApiMediaFormat, ApiMessage, ApiPhoto } from "../../../api/types"
import { getPhotoMediaHash } from "../../../global/helpers"
import buildClassName from "../../../util/buildClassName"
import useMedia from "../hook/useMedia"
import { getActions } from "../../../global"

type IProps = {
  theme?: ThemeKey;
  message: Message;
};
const ImageSummaryMessage = (props: IProps) => {
  let content: any = {};
  let message: ApiMessage | undefined = undefined
  let photo: ApiPhoto | undefined = undefined
  try {
    content = JSON.parse(props?.message.content);
    message = content?.message
    photo = message?.content?.photo
  } catch (error) {}

  const imgBlobUrl = useMedia(photo ? getPhotoMediaHash(photo, 'inline') : undefined, false, ApiMediaFormat.BlobUrl);
  const fullMediaData = photo?.blobUrl || imgBlobUrl;
  const forcedWidth = photo?.thumbnail?.width
  const withBlurredBackground = Boolean(forcedWidth);

  function onPreviewClick() {
    const {
      openMediaViewer,
    } = getActions();

    openMediaViewer({
      chatId: message?.chatId,
      threadId: -1,
      messageId: message?.id,
      origin: MediaViewerOrigin.Inline,
      withDynamicLoading: true,
    });
  }

  console.log("aiChatFoldersTask----message",message)

  return (
    <div>
      <div className="p-3">
        {fullMediaData && (
          <img
            src={fullMediaData}
            className={buildClassName('full-media cursor-pointer', withBlurredBackground && 'with-blurred-bg')}
            alt=""
            // @ts-ignore
            style={{ width: `${forcedWidth ?? 0}px` }}
            onClick={onPreviewClick}
          />
        )}
      </div>

      <div className="rounded-[16px] bg-[var(--color-background)] mx-2 p-3 w-full text-[14px]">
        <div className="text-[#181818] font-[600]">Image summarize</div>
        <div className="flex flex-col gap-[6px] mt-2">
          {content?.summaryInfo}
        </div>
      </div>
    </div>
  );
};

export default ImageSummaryMessage;
