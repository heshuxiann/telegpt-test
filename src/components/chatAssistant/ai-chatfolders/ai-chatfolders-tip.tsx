import React, { FC, memo, useState } from "../../../lib/teact/teact";
import AiChatFoldersBg from "../../../assets/chat_ai_folder.png";
import AiChatFoldersDarkBg from "../../../assets/chat_ai_folder_dark.png";
import AiChatFoldersBtnBg from "../../../assets/chat_ai_folder_border.png";
import Icon from "../../common/icons/Icon";
import { ChataiStores, GLOBAL_AICHATFOLDERS_TIP_SHOW } from "../store";
import { getActions, withGlobal } from "../../../global";
import { aiChatFoldersTask } from "../ai-task/ai-chatfolders-task";
import { message } from "antd";
import { SVGProps } from "react";
import { selectTheme } from "../../../global/selectors";
import { ThemeKey } from "../../../types";
import Spinner from "../../ui/Spinner";
import buildClassName from "../../../util/buildClassName";

type OwnProps = {
  theme: ThemeKey;
  onClose?: () => void;
};
const AIChatFoldersTip: FC<OwnProps> = ({ theme, onClose }: OwnProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  function onCloseClick() {
    message.info(
      "You can enable this feature later in the settings page if needed."
    );
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, false);
    onClose?.();
  }

  async function onApply() {
    if (loading) return;
    const { setSharedSettingOption } = getActions();

    setSharedSettingOption({ aiChatFolders: true });
    setLoading(true);
    await aiChatFoldersTask.classifyChatMessageByCount();
    setLoading(false);

    onCloseClick();
  }

  return (
    <div
      className="py-2 flex flex-row items-center relative px-3 gap-3"
      style={`background-image: url(${
        theme === "dark" ? AiChatFoldersDarkBg : AiChatFoldersBg
      }); background-size: 100% 100%;`}
    >
      <div className="text-[var(--color-aichatfolders-tag-text)]">
        <AIChatFolderIcon />
      </div>
      <div className="leading-[16px] text-[var(--color-aichatfolders-tag-text)]">
        Your chat has been intelligently tagged in folders by Serena AI
      </div>
      <div
        color="translucent"
        className={buildClassName(
          "flex flex-row items-center justify-center gap-1 py-[6px] mr-3 rounded-[28px] cursor-pointer hover:opacity-80",
          loading ? "px-2" : "px-3"
        )}
        style={`background-image: url(${AiChatFoldersBtnBg}); background-size: 100% 100%; text-transform: none; color: #000;`}
        onClick={onApply}
      >
        {loading && <Spinner className="flex-shrink-0 w-[12px] h-[12px]" />}
        <div className="text-[var(--color-aichatfolders-tag-text)] text-[12px]">
          Apply
        </div>
      </div>
      <div className="absolute right-2 top-1">
        {!loading && (
          <Icon
            name="close"
            className="text-[var(--color-aichatfolders-tag-close-color)] cursor-pointer hover:opacity-50"
            style="width:6px;height:6px"
            onClick={onCloseClick}
          />
        )}
      </div>
    </div>
  );
};

export default memo(
  withGlobal<OwnProps>((global) => {
    return {
      theme: selectTheme(global),
    };
  })(AIChatFoldersTip)
);

const AIChatFolderIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={21}
    height={21}
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      d="M13.375 7.625 9.54 6.187l3.834-1.439L14.812.917l1.44 3.831 3.831 1.44-3.832 1.437-1.439 3.833-1.437-3.833ZM5.708 15.29.917 13.375l4.791-1.917 1.917-4.792 1.916 4.792 4.792 1.917-4.792 1.916-1.916 4.792-1.917-4.791Z"
    />
  </svg>
);
