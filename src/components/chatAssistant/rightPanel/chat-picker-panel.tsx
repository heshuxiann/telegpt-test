/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
/* eslint-disable no-console */
import React, {
  useCallback, useMemo, useState,
} from 'react';
import type { CheckboxChangeEvent } from 'antd';
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

import Avatar from '../component/Avatar';
import FloatingActionButton from '../component/FloatingActionButton';
import Icon from '../component/Icon';
import { useDrawerStore } from '../global-summary/DrawerContext';

import './chat-picker-panel.scss';

const PickerChatItem = ({ id, isChecked, onChange }:{
  id: string;
  isChecked:boolean;
  onChange:(e:CheckboxChangeEvent) => void;
}) => {
  const global = getGlobal();
  const lang = useOldLang();
  const {
    currentUserId,
  } = global;
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
    <Checkbox
      value={id}
      className="chat-picker-item rounded-[12px]"
      checked={isChecked}
      onChange={onChange}
    >
      <div className="flex-1 flex flex-row items-center gap-[12px] px-[12px] py-[10px] hover:bg-[var(--color-chat-hover)] rounded-[12px]">
        <Avatar
          peer={peer}
          isSavedMessages={isSelf}
          clickOpenRoom={false}
          size="medium"
        />
        <div className="flex flex-col gap-[4px] justify-center text-[var(--color-text)] flex-1 overflow-hidden">
          <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">{specialTitle}</div>
          <div>{subtitle}</div>
        </div>
      </div>
    </Checkbox>
  );
};

const ChatPickerPanel = () => {
  const global = getGlobal();
  const orderedIds = React.useMemo(() => getOrderedIds(ALL_FOLDER_ID) || [], []);
  const { drawerParams } = useDrawerStore();
  const selectedChats = drawerParams?.selectedChats || [];
  const [selected, setSelected] = useState<string[]>(selectedChats);
  const [search, setSearch] = useState('');
  const filter:ApiChatType[] = useMemo(() => ['channels', 'chats', 'users', 'groups'], []);

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

  const handleSave = useCallback(() => {
    drawerParams?.onSave(selected);
  }, [drawerParams, selected]);
  return (
    <div className="h-full px-[20px] flex flex-col text-[var(--color-text)]">
      <Input placeholder="Search" onChange={(e) => setSearch(e.target.value)} />
      <div className="flex-1 overflow-y-auto">
        <Checkbox.Group className="w-full" value={selected}>
          <div className="flex flex-col gap-[12px] w-full overflow-hidden">
            {ids.map((id) => {
              const isChecked = selected.includes(id);
              return (
                <PickerChatItem
                  id={id}
                  isChecked={isChecked}
                  onChange={(e:CheckboxChangeEvent) => {
                    const checked = e.target.checked;
                    setSelected((prev) => {
                      if (checked) {
                        return [...prev, id];
                      } else {
                        return prev.filter((item) => item !== id);
                      }
                    });
                  }}
                />
              );
            })}
          </div>
        </Checkbox.Group>
      </div>
      <FloatingActionButton
        isShown
        onClick={handleSave}
      >
        <Icon name="check" className="text-white text-[1.5rem]" />
      </FloatingActionButton>
    </div>
  );
};

export default ChatPickerPanel;
