/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
/* eslint-disable no-console */
import React, {
  useCallback, useMemo, useState,
} from 'react';
import { Checkbox, Input } from 'antd';
import { getGlobal } from '../../../global';

import type { ApiChatType, ApiPeer } from '../../../api/types';
import type { CustomPeer } from '../../../types';

import { ALL_FOLDER_ID } from '../../../config';
import {
  getChatTitle, getGroupStatus, getUserFullName, getUserStatus,
} from '../../../global/helpers';
import { filterPeersByQuery, isApiPeerChat, isApiPeerUser } from '../../../global/helpers/peers';
import {
  filterChatIdsByType, selectPeer,
  selectUserStatus,
} from '../../../global/selectors';
import { getOrderedIds } from '../../../util/folderManager';
import sortChatIds from '../../common/helpers/sortChatIds';
import useOldLang from '../hook/useOldLang';

import { useDrawer } from '../globalSummary/DrawerContext';
import Avatar from '../ui/Avatar';

const ChatPickerPanel = () => {
  const global = getGlobal();
  const orderedIds = React.useMemo(() => getOrderedIds(ALL_FOLDER_ID) || [], []);
  const {
    currentUserId,
  } = global;
  const { drawerParams } = useDrawer();
  const selectedChats = drawerParams?.selectedChats || [];
  const [selected, setSelected] = useState<string[]>(selectedChats);
  const [search, setSearch] = useState('');
  const filter:ApiChatType[] = useMemo(() => ['channels', 'chats', 'users', 'groups'], []);
  const lang = useOldLang();

  const ids = useMemo(() => {
    const sorted = sortChatIds(
      filterPeersByQuery({
        ids: orderedIds,
        query: search,
      }),
      undefined,
    );

    return filterChatIdsByType(global, sorted, filter);
  }, [filter, global, orderedIds, search]);

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
      if (peer.id === currentUserId) return [lang('SavedMessagesInfo')];
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
      <Checkbox value={id}>
        <div className="flex-1 flex flex-row items-center gap-[12px] px-[12px] py-[10px] hover:bg-[#F4F4F5] rounded-[12px]">
          <Avatar
            peer={peer}
            isSavedMessages={isSelf}
            size="medium"
          />
          <div className="flex flex-col gap-[4px] justify-center">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{specialTitle}</div>
            <div>{subtitle}</div>
          </div>
        </div>
      </Checkbox>
    );
  };
  const onChange = useCallback((checkedValues: string[]) => {
    console.log('checked = ', checkedValues);
    setSelected(checkedValues);
  }, []);

  const handleCancel = useCallback(() => {
    drawerParams?.onCancel();
  }, [drawerParams]);

  const handleSave = useCallback(() => {
    drawerParams?.onSave(selected);
  }, [drawerParams, selected]);
  return (
    <div className="h-full px-[20px] flex flex-col">
      <Input placeholder="Search" onChange={(e) => setSearch(e.target.value)} />
      <div className="flex-1 overflow-y-auto">
        <Checkbox.Group onChange={onChange} value={selected}>
          <div className="flex flex-col gap-[12px]">
            {ids.map((id) => renderChatItem(id))}
          </div>
        </Checkbox.Group>
      </div>
      <div className="flex flex-row justify-center gap-[14px] mt-auto pb-[24px] pt-[12px]">
        <button
          className="w-[158px] h-[40px] border-[1px] border-[#8C42F0] rounded-[20px]"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="w-[158px] h-[40px] border-[1px] border-[#8C42F0] bg-[#8C42F0] rounded-[20px] text-white"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default ChatPickerPanel;
