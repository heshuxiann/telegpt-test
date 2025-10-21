/* eslint-disable max-len */
import React, { useState } from 'react';
import { getGlobal } from '../../../global';

import type { ApiPeer } from '../../../api/types';
import type { CustomPeer } from '../../../types';

import { ALL_FOLDER_ID } from '../../../config';
import {
  getChatTitle,
  getGroupStatus,
  getUserFullName,
  getUserStatus,
} from '../../../global/helpers';
import { isApiPeerChat, isApiPeerUser } from '../../../global/helpers/peers';
import { selectPeer, selectUserStatus } from '../../../global/selectors';
import { getOrderedIds } from '../../../util/folderManager';
import useOldLang from '../hook/useOldLang';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

import Avatar from '../component/Avatar';
import Icon from '../component/Icon';

import './rooms-tab.scss';
import './selected-chats.scss';

interface Props {
  title: string;
  ignoredIds: string[];
  onIgnored: (id: string) => void;
  onUnIgnored: (id: string) => void;
}

export const RoomsTab = (props: Props) => {
  const {
    title,
    ignoredIds,
    onIgnored,
    onUnIgnored,
  } = props;
  const orderedIds = React.useMemo(() => {
    const ids = getOrderedIds(ALL_FOLDER_ID) || [];
    return ids.filter((id) => id !== GLOBAL_SUMMARY_CHATID);
  }, []);
  const unIgnoreIds = orderedIds.filter((id) => !ignoredIds.includes(id));
  const [activeTab, setActiveTab] = useState<'summary' | 'ignored'>('summary');
  const lang = useOldLang();
  const global = getGlobal();

  const renderRoomItem = (
    id: string,
    isIgnored: boolean,
  ) => {
    const peer: ApiPeer | undefined = selectPeer(global, id);
    if (!peer) {
      return undefined;
    }

    const isSelf = peer && !isApiPeerChat(peer) ? peer.isSelf : undefined;
    const customPeer = 'isCustomPeer' in peer ? peer : undefined;
    const realPeer = 'id' in peer ? peer : undefined;
    const isUser = realPeer && isApiPeerUser(realPeer);
    // eslint-disable-next-line @typescript-eslint/no-shadow
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
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
      <div className="chat-picker-item flex-1 flex flex-row items-center gap-[12px] py-[10px] rounded-[12px]" key={id}>
        <Avatar
          peer={peer}
          isSavedMessages={isSelf}
          size="medium"
        />
        <div className="flex flex-col gap-[4px] justify-center flex-1 overflow-hidden">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap font-medium">{specialTitle}</div>
          <div className="text-[var(--color-text-secondary)] text-sm">{subtitle}</div>
        </div>
        {isIgnored ? (
          <div
            className="chat-picker-item-btn text-white text-sm bg-[#5493F2] w-auto px-[5px] h-[26px] rounded-[6px] flex items-center justify-center"
            onClick={() => onUnIgnored(id)}
          >
            Stop Ignoring
          </div>
        ) : (
          <div
            className="chat-picker-item-btn text-white text-sm bg-[#FF5757] w-auto px-[5px] h-[26px] rounded-[6px] flex items-center justify-center"
            onClick={() => onIgnored(id)}
          >
            <Icon name="eye-crossed" />
            Ignore
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="summary-rooms-tab mt-[20px]">
      <div className="tabs-container">
        <button
          className={`font-medium text-base ${
            activeTab === 'summary'
              ? 'text-[var(--color-text)] active'
              : 'text-[var(--color-text-secondary)] '
          }`}
          onClick={() => setActiveTab('summary')}
        >
          {title}
        </button>
        <button
          className={`font-medium text-base ${
            activeTab === 'ignored'
              ? 'text-[var(--color-text)] active'
              : 'text-[var(--color-text-secondary)] '
          }`}
          onClick={() => setActiveTab('ignored')}
        >
          Ignored Chats
        </button>
      </div>

      {activeTab === 'summary' ? (
        <div>
          {unIgnoreIds.length > 0 && (
            <div className="mt-[16px] space-y-[8px]">
              {unIgnoreIds.map((id) => renderRoomItem(id, false))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {ignoredIds.length > 0 && (
            <div className="mt-[16px] space-y-[8px]">
              {ignoredIds.map((id) => renderRoomItem(id, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
