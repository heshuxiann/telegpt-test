import { PRESET_FOLDER_ID } from "../../../config";
import { getGlobal, setGlobal } from "../../../global";
import React, { memo, useEffect, useMemo } from "../../../lib/teact/teact";
import type { FC } from "../../../lib/teact/teact";
import buildClassName from "../../../util/buildClassName";
import Modal from "../../ui/Modal";
import { ChataiStores } from "../store";
import { getAITags } from "./tag-filter"
interface IProps {
  activeTag: string[];
  setActiveTag: (tag: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
  folderId?: number;
}
const PRESET_TAGS = [
  "Public Chain",
  "DeFi",
  "NFT/GameFi",
  "Wallets & Tools",
  "DAO",
  "Layer2",
  "Security & Audits",
  "Fundraising & Investment",
  "Meme",
  "Launchpad/IDO",
  "KOL & Community Growth",
  "Legal & Compliance",
];
const PRESET_REGIONAL = [
  "United States",
  "Southeast Asia",
  "Europe",
  "China",
  "Global",
];

export const GLOBAL_PRESET_TAG = "globalPresetTag";
export const GLOBAL_AI_TAG = "globalAITag"

const PresetTagModal: FC<IProps> = ({
  folderId,
  activeTag,
  setActiveTag,
  isOpen,
  onClose,
}) => {
  const tagList = useMemo(() => {
    return folderId === PRESET_FOLDER_ID ? PRESET_TAGS : getAITags();
  }, [folderId, getAITags]);

  function onClickTag(tag: string) {
    let currentTag = activeTag;
    if (currentTag.indexOf(tag) >= 0) {
      // remove tag
      currentTag = currentTag.filter((item) => item !== tag);
    } else {
      // add tag
      currentTag = [...currentTag, tag];
    }
    setActiveTag(currentTag);

    let global = getGlobal();
    ChataiStores.general?.set(folderId === PRESET_FOLDER_ID ? GLOBAL_PRESET_TAG : GLOBAL_AI_TAG, currentTag);
    global = {
      ...global,
      chatFolders: {
        ...global.chatFolders,
        classifys: {
          ...global.chatFolders.classifys,
          [folderId === PRESET_FOLDER_ID ? 'activePresetTag' : 'activeAITag']: currentTag,
        },
      },
    };
    setGlobal(global);

    onClose?.();
  }

  if (tagList?.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dialogStyle="max-width: 400px; max-height: 600px; position: absolute; left: 100px; top: 70px;"
    >
      <div className="m-[-10px]">
        {folderId === PRESET_FOLDER_ID && <div className="text-[#676B74] text-[12px] mb-3">Industry</div>}
        <div className="flex flex-row flex-wrap gap-2 my-2">
          {tagList.map((tag) => (
            <div
              className={buildClassName(
                "rounded-[6px] px-3 py-2 text-[13px] hover:opacity-80 cursor-pointer",
                activeTag.indexOf(tag) >= 0
                  ? "bg-[#7D40FF] text-[#fff]"
                  : "bg-[#F5F1FF] text-[#000]"
              )}
              onClick={() => onClickTag(tag)}
            >
              {tag}
            </div>
          ))}
        </div>
        {folderId === PRESET_FOLDER_ID && (
          <>
            <div className="text-[#676B74] text-[12px] my-3">Regional</div>
            <div className="flex flex-row flex-wrap gap-2 my-2">
              {PRESET_REGIONAL.map((tag) => (
                <div
                  className={buildClassName(
                    "rounded-[6px] px-3 py-2 text-[13px] hover:opacity-80 cursor-pointer",
                    activeTag.indexOf(tag) >= 0
                      ? "bg-[#7D40FF] text-[#fff]"
                      : "bg-[#F5F1FF] text-[#000]"
                  )}
                >
                  {tag}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default memo(PresetTagModal);
