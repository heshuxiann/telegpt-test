/* eslint-disable max-len */
import React from 'react';
import { getGlobal } from '../../../global';

import type { ApiPeer } from '../../../api/types';
import type { CustomPeer } from '../../../types';

import {
  getChatTitle, getGroupStatus, getUserFullName, getUserStatus,
} from '../../../global/helpers';
import { isApiPeerChat, isApiPeerUser } from '../../../global/helpers/peers';
import { selectPeer, selectUserStatus } from '../../../global/selectors';
import useOldLang from '../hook/useOldLang';

import Icon from '../component/Icon';
import Avatar from '../ui/Avatar';

import './selected-chats.scss';

interface Props {
  selected: string[];
  onOpenChatSelect:() => void;
  onDelete: (id: string) => void;
}
export const SelectedChats = (props: Props) => {
  const { onOpenChatSelect, selected, onDelete } = props;
  const lang = useOldLang();
  const global = getGlobal();
  const renderChatItem = (id: string) => {
    const peer:ApiPeer | undefined = selectPeer(global, id);
    if (!peer) {
      return undefined;
    }

    const isSelf = peer && !isApiPeerChat(peer) ? peer.isSelf : undefined;
    const customPeer = 'isCustomPeer' in peer ? peer : undefined;
    const realPeer = 'id' in peer ? peer : undefined;
    const isUser = realPeer && isApiPeerUser(realPeer);
    const title = realPeer && (isUser ? getUserFullName(realPeer) : getChatTitle(lang, realPeer));
    function getSubtitle() {
      if (!peer) return undefined;
      if (isApiPeerChat(peer)) {
        return [getGroupStatus(lang, peer)];
      }

      const userStatus = selectUserStatus(global, peer.id);
      return getUserStatus(lang, peer, userStatus);
    }

    function getTitle() {
      if (customPeer) {
        return (customPeer as CustomPeer)?.title || lang((customPeer as CustomPeer)?.titleKey!);
      }

      if (isSelf) {
        return lang('SavedMessages');
      }

      return title;
    }

    const subtitle = getSubtitle() || '';
    const specialTitle = getTitle();
    return (
      <div className="chat-picker-item flex-1 flex flex-row items-center gap-[12px] py-[10px] hover:bg-[#F4F4F5] rounded-[12px]">
        <Avatar
          peer={peer}
          isSavedMessages={isSelf}
          size="medium"
        />
        <div className="flex flex-col gap-[4px] justify-center flex-1">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{specialTitle}</div>
          <div>{subtitle}</div>
        </div>
        <Icon
          name="delete"
          className="chat-picker-del ml-auto cursor-pointer text-[18px] text-[#FF4D4F]"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => { onDelete(id); }}
        />
      </div>
    );
  };
  return (
    <div className="mt-[40px]">
      <h3 className="text-[18px] font-semibold">Which chats do you care about？</h3>
      <div
        className="chat-picker-item flex cursor-pointer items-center gap-[8px] py-[10px] hover:bg-[#F4F4F5] rounded-[12px]"
        onClick={onOpenChatSelect}
      >
        <div
          className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-[#8C42F0] text-white"
        >
          <Icon name="add" />
        </div>
        <span>Add Chats</span>
      </div>
      {selected.length > 0 && (
        <>
          {selected.map((id) => renderChatItem(id))}
        </>
      )}
    </div>
  );
};
