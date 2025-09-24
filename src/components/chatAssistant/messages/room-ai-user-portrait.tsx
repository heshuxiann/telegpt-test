/* eslint-disable */
import React from "react";
import { getActions, getGlobal } from "../../../global";
import { selectUser } from "../../../global/selectors";
import SerenaPath from "../../chatAssistant/assets/serena.png";
import useLastCallback from "../../../hooks/useLastCallback";
import Avatar from "../component/Avatar";

type IProps = {
  userId: string;
};

export type MessageStatus = "loading" | "success" | "error";

const RoomAIUserPortraitMessage: React.FC<IProps> = (props) => {
  const global = getGlobal();
  const { openUserPortrait } = getActions();
  const userId = props?.userId;
  const user = userId ? selectUser(global, userId) : undefined;

  const handlePortraitClick = useLastCallback(() => {
    openUserPortrait({ userId });
  });

  return (
    <div className="flex flex-col gap-2 px-3 text-[14px]">
      <div className="rounded-[16px] bg-[var(--color-ai-room-media-bg)] text-[var(--color-text)] p-3 text-[14px]">
        <div className="flex items-center gap-2">
          <img src={SerenaPath} className="w-[18px] h-[18px]" />
          TelyAI
        </div>
        {user ? (
          <div
            onClick={handlePortraitClick}
            className="flex flex-row items-center gap-2 mt-2 cursor-pointer hover:opacity-80"
          >
            <Avatar peer={user} size="small" />
            {`${user?.firstName || ""} ${user?.lastName || ""}`} 's Portrait
          </div>
        ) : (
          <div>Couldn't find the user.</div>
        )}
      </div>
    </div>
  );
};

export default RoomAIUserPortraitMessage;
