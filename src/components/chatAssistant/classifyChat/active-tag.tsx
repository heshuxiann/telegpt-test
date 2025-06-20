import { getGlobal, setGlobal } from "../../../global";
import React, { memo } from "../../../lib/teact/teact";
import Icon from "../../common/icons/Icon";
import { FolderType } from "../../left/main/ChatList";
import { ChataiStores, GLOBAL_AI_TAG, GLOBAL_PRESET_TAG } from "../store";

const ActiveTag = ({
  folderType,
  tags,
  setActiveTag,
}: {
  folderType: FolderType;
  tags: string[];
  setActiveTag: (tag: string[]) => void;
}) => {
  function onDelete(tag: string) {
    const currentTag = tags.filter((item) => item !== tag);
    setActiveTag(currentTag);

    let global = getGlobal();
    ChataiStores.general?.set(
      folderType === "preset" ? GLOBAL_PRESET_TAG : GLOBAL_AI_TAG,
      currentTag
    );
    global = {
      ...global,
      chatFolders: {
        ...global.chatFolders,
        classifys: {
          ...global.chatFolders.classifys,
          [folderType === "preset" ? "activePresetTag" : "activeAITag"]:
            currentTag,
        },
      },
    };
    setGlobal(global);
  }

  if ((folderType === "preset" || folderType === "ai") && tags?.length) {
    return (
      <div className="flex flex-row flex-wrap items-center gap-2 px-2 pt-3">
        {tags.map((item) => {
          return (
            <div className="bg-[var(--color-classify-tag-bg)] h-[27px] leading-[27px] text-[13px] font-[500] text-[var(--color-classify-tag-text)] rounded-[6px] px-2 relative">
              {item}
              <div
                className="absolute top-[-4px] right-[-4px] w-[12px] h-[12px] flex items-center justify-center bg-[var(--color-classify-tag-bg-active)] rounded-full cursor-pointer hover:opacity-80 border-[1px] border-[var(--color-classify-tag-border)]"
                onClick={() => onDelete(item)}
              >
                <CloseIcon/>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};

export default memo(ActiveTag);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={8} height={8} fill="none" className="scale-[0.8]">
    <path
      fill="#fff"
      d="M4 4.7 1.55 7.15a.474.474 0 0 1-.35.137.474.474 0 0 1-.35-.137.474.474 0 0 1-.138-.35c0-.142.046-.258.138-.35L3.3 4 .85 1.55a.474.474 0 0 1-.138-.35A.474.474 0 0 1 1.2.713c.143 0 .26.045.35.137L4 3.3 6.45.85A.474.474 0 0 1 6.8.712a.474.474 0 0 1 .487.487.474.474 0 0 1-.136.35L4.7 4l2.45 2.45a.474.474 0 0 1 .137.35.474.474 0 0 1-.137.35.474.474 0 0 1-.35.138.474.474 0 0 1-.35-.137L4 4.7Z"
    />
  </svg>
);
