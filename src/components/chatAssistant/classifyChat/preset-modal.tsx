import { getGlobal, setGlobal } from "../../../global"
import React, { memo, useState, useEffect } from "../../../lib/teact/teact";
import type { FC } from "../../../lib/teact/teact";
import buildClassName from "../../../util/buildClassName";
import Modal from "../../ui/Modal"
import { ChataiStores } from "../store"
interface IProps {
  activeTag: string
  setActiveTag: (tag: string) => void
  isOpen: boolean
  onClose: () => void;
}
const PRESET_TAGS = [
  "公链生态",
  "DeFi",
  "NFT/游戏",
  "钱包与工具",
  "DAO",
  "Layer2",
  "安全与审计",
  "投融资动态",
  "Meme项目",
  "Launchpad/IDO",
  "KOL与社区传播",
  "法律合规",
];
const PRESET_REGIONAL = [
  "United States",
  "Southeast Asia",
  "Europe",
  "China",
  "Global",
];

export const GLOBAL_PRESET_TAG = "globalPresetTag";

const PresetTagModal: FC<IProps> = ({ activeTag, setActiveTag, isOpen, onClose }) => {

  function onClickTag(tag: string) {
    setActiveTag(tag)

    let global = getGlobal();
    ChataiStores.general?.set(GLOBAL_PRESET_TAG, tag)
    global = {
      ...global,
      chatFolders: {
        ...global.chatFolders,
        classifys: {
          ...global.chatFolders.classifys,
          activeTag: tag,
        },
      },
    };
    setGlobal(global);

    onClose?.();
  }

  useEffect(()=>{
    ChataiStores.general?.get(GLOBAL_PRESET_TAG)?.then((res)=>{
      setActiveTag(res)
    })
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} dialogStyle="max-width: 400px; position: absolute; left: 100px; top: 70px;" >
      <div>
        <div className="text-[#676B74] text-[12px] mb-3">Industry</div>
        <div className="flex flex-row flex-wrap gap-2 my-2">
          {PRESET_TAGS.map((tag) => (
            <div
              className={buildClassName(
                "rounded-[6px] px-3 py-2 text-[13px] hover:opacity-80 cursor-pointer",
                tag === activeTag
                  ? "bg-[#7D40FF] text-[#fff]"
                  : "bg-[#F5F1FF] text-[#000]"
              )}
              onClick={() => onClickTag(tag)}
            >
              {tag}
            </div>
          ))}
        </div>
        <div className="text-[#676B74] text-[12px] my-3">Regional</div>
        <div className="flex flex-row flex-wrap gap-2 my-2">
          {PRESET_REGIONAL.map((tag) => (
            <div
              className={buildClassName(
                "rounded-[6px] px-3 py-2 text-[13px] hover:opacity-80 cursor-pointer",
                tag === activeTag
                  ? "bg-[#7D40FF] text-[#fff]"
                  : "bg-[#F5F1FF] text-[#000]"
              )}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default memo(PresetTagModal);

