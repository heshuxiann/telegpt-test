import React, { FC, memo, useState, useEffect } from "../../../lib/teact/teact";
import AiChatFoldersBg from "../../../assets/chat_ai_folder.png";
import AiChatFoldersDarkBg from "../../../assets/chat_ai_folder_dark.png";
import AiChatFoldersBtnBg from "../../../assets/chat_ai_folder_border.png";
import Icon from "../../common/icons/Icon";
import { ChataiStores, GLOBAL_AICHATFOLDERS_TIP_SHOW } from "../store";
import { getActions, withGlobal } from "../../../global";
import { aiChatFoldersTask } from "../ai-task/ai-chatfolders-task";
import { message } from "antd";
import { selectTheme } from "../../../global/selectors";
import { ThemeKey } from "../../../types";
import Spinner from "../../ui/Spinner";
import "./ai-chatfolders-tip.scss";
import Button from "../../ui/Button";
import { AIChatFolder, deleteNextAiChatFolders, hideTip } from "./util";

export enum AIChatFolderStep {
  classify = "classify",
  apply = "apply",
}

type OwnProps = {
  step: AIChatFolderStep;
  loading?: boolean;
  onClose?: () => void;
};
type StateProps = {
  theme: ThemeKey;
  nextAiChatFolders: AIChatFolder[];
};

const AIChatFoldersTip: FC<OwnProps & StateProps> = ({
  step,
  loading,
  theme,
  nextAiChatFolders,
  onClose,
}: OwnProps & StateProps) => {
  const [isFristShow, setIsFristShow] = useState<boolean>(true);

  function onCloseClick() {
    if (isFristShow) {
      message.open({
        content:
          "You can enable this feature later in the settings page if needed.",
        icon: null,
        className: "aichatfolders-tip-message",
      });
    }
    hideTip(AIChatFolderStep.classify)
    deleteNextAiChatFolders()
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, false);
    onClose?.();
  }

  async function onApply() {
    if (loading) return;
    if (isFristShow) {
      const { setSharedSettingOption } = getActions();
      setSharedSettingOption({ aiChatFolders: true });
    }
    if (nextAiChatFolders && nextAiChatFolders.length <= 0) {
      await aiChatFoldersTask.classifyChatMessageByCount();
    }
    await aiChatFoldersTask.applyChatFolder();

    onCloseClick();
  }

  useEffect(() => {
    ChataiStores.general?.get(GLOBAL_AICHATFOLDERS_TIP_SHOW)?.then((res) => {
      setIsFristShow(res === undefined ? true : false);
    });
  }, [loading]);

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
      <div className="leading-[16px] text-[13px] text-[var(--color-aichatfolders-tag-text)]">
        {!isFristShow && step === AIChatFolderStep.classify
          ? "Serena AI is working hard to organize your chat list and categorize the labels..."
          : "Your chat has been intelligently tagged in folders by Serena AI"}
      </div>
      {(isFristShow || step === AIChatFolderStep.apply) && (
        <>
          <Button
            color="translucent"
            className="w-[46px] h-[24px] mr-3 rounded-[28px] cursor-pointer hover:opacity-80"
            style={`background-image: url(${AiChatFoldersBtnBg}); background-size: 100% 100%; text-transform: none; color: #000;`}
            onClick={onApply}
          >
            {loading ? (
              <Spinner
                className="w-[12px] h-[12px]"
                color={theme === "dark" ? "white" : "black"}
              />
            ) : (
              <div className="text-[var(--color-aichatfolders-tag-text)] text-[12px]">
                Apply
              </div>
            )}
          </Button>
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
        </>
      )}
    </div>
  );
};

export default memo(
  withGlobal<OwnProps>((global) => {
    const nextAiChatFolders = global.chatFolders.nextAiChatFolders;
    return {
      theme: selectTheme(global),
      nextAiChatFolders,
    };
  })(AIChatFoldersTip)
);

const AIChatFolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={21} height={21} fill="none">
    <path
      fill="currentColor"
      d="M13.375 7.625 9.54 6.187l3.834-1.439L14.812.917l1.44 3.831 3.831 1.44-3.832 1.437-1.439 3.833-1.437-3.833ZM5.708 15.29.917 13.375l4.791-1.917 1.917-4.792 1.916 4.792 4.792 1.917-4.792 1.916-1.916 4.792-1.917-4.791Z"
    />
  </svg>
);
