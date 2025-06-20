import React, { FC, memo } from "../../../lib/teact/teact";
import AiChatFoldersPreIcon from "../../../assets/ix_ai.png";
import AiChatFoldersBg from "../../../assets/chat_ai_folder.png";
import AiChatFoldersBtnBg from "../../../assets/chat_ai_folder_border.png";
import Button from "../../ui/Button";
import Icon from "../../common/icons/Icon";
import { ChataiStores, GLOBAL_AICHATFOLDERS_TIP_SHOW } from "../store";
import { getActions } from "../../../global";
import { aiChatFoldersTask } from "../ai-task/ai-chatfolders-task"

const AIChatFoldersTip: FC = ({ onClose }: { onClose?: () => void }) => {
  function onCloseClick() {
    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, false);
    onClose?.();
  }

  function onApply() {
    const { setSharedSettingOption } = getActions();

    setSharedSettingOption({ aiChatFolders: true });

    aiChatFoldersTask.classifyChatMessageByCount()

    ChataiStores.general?.set(GLOBAL_AICHATFOLDERS_TIP_SHOW, false);
    onClose?.();
  }

  return (
    <div
      className="py-2 flex flex-row items-center relative px-3 gap-4"
      style={`background-image: url(${AiChatFoldersBg}); background-size: 100% 100%;`}
    >
      <img
        src={AiChatFoldersPreIcon}
        alt="AI Chat Folder Logo"
        className="w-[23px] h-[23px]"
      />
      <div className="leading-[16px]">
        Your chat has been intelligently tagged in folders by Serena AI
      </div>
      <Button
        color="translucent"
        className="w-[46px] h-[24px] rounded-[28px] text-[12px] mr-3"
        style={`background-image: url(${AiChatFoldersBtnBg}); background-size: 100% 100%; text-transform: none; color: #000;`}
        onClick={onApply}
      >
        Apply
      </Button>
      <div className="absolute right-2 top-1">
        <Icon
          name="close"
          className="text-[#00000029] cursor-pointer hover:opacity-50"
          style="width:6px;height:6px"
          onClick={onCloseClick}
        />
      </div>
    </div>
  );
};

export default memo(AIChatFoldersTip);
