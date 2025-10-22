import React from '@teact';
import type { FC } from '../../../lib/teact/teact';
import { memo, useEffect, useRef } from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';

import type { ApiPeer, ApiUser } from '../../../api/types';

import buildClassName from '../../../util/buildClassName';
import setTooltipItemVisible from '../../../util/setTooltipItemVisible';
import SerenaPath from '../../chatAssistant/assets/serena.png';

import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import usePreviousDeprecated from '../../../hooks/usePreviousDeprecated';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

import PrivateChatInfo from '../../common/PrivateChatInfo';
import ListItem from '../../ui/ListItem';

import './MentionTooltip.scss';

export type OwnProps = {
  isOpen: boolean;
  filteredUsers: ApiUser[] | undefined;
  onInsertUserName: (peer: ApiPeer, forceFocus?: boolean, insertAtEnd?: boolean) => void;
  onInsertUsersAll?: (users: ApiUser[]) => void;
  onClose: NoneToVoidFunction;
  onReset?: NoneToVoidFunction;
};

const MentionTooltip: FC<OwnProps> = ({
  isOpen,
  filteredUsers,
  onClose,
  onInsertUserName,
  onInsertUsersAll,
}) => {
  const containerRef = useRef<HTMLDivElement>();
  const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isOpen, undefined, undefined, false);
  const lang = useOldLang();

  const handleUserSelect = useLastCallback((userId: string, forceFocus = false, insertAtEnd = false) => {
    const usersById = getGlobal().users.byId;
    const user = usersById[userId];
    if (!user) {
      return;
    }

    onInsertUserName(user, forceFocus, insertAtEnd);
  });

  const handleMentionAll = useLastCallback(() => {
    const renderedChatMembers = filteredUsers && filteredUsers.length
      ? filteredUsers
      : undefined;

    if (!renderedChatMembers?.length) {
      return;
    }

    // Prefer batch insertion when available
    if (onInsertUsersAll) {
      onInsertUsersAll(renderedChatMembers);
      return;
    }

    // Fallback: sequential insert (older behavior)
    renderedChatMembers.forEach((member, index) => {
      handleUserSelect(member.id, index === 0, index > 0);
    });
  });

  const handleClick = useLastCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();

    handleUserSelect(id);
  });

  const handleSelectMention = useLastCallback((member: ApiUser) => {
    handleUserSelect(member.id, true);
  });

  const selectedMentionIndex = useKeyboardNavigation({
    isActive: isOpen,
    items: filteredUsers,
    onSelect: handleSelectMention,
    shouldSelectOnTab: true,
    shouldSaveSelectionOnUpdateItems: true,
    onClose,
  });

  useEffect(() => {
    setTooltipItemVisible('.chat-item-clickable', selectedMentionIndex, containerRef);
  }, [selectedMentionIndex]);

  useEffect(() => {
    if (filteredUsers && !filteredUsers.length) {
      onClose();
    }
  }, [filteredUsers, onClose]);

  const prevChatMembers = usePreviousDeprecated(
    filteredUsers?.length
      ? filteredUsers
      : undefined,
    shouldRender,
  );
  const renderedChatMembers = filteredUsers && !filteredUsers.length
    ? prevChatMembers
    : filteredUsers;

  if (!shouldRender || (renderedChatMembers && !renderedChatMembers.length)) {
    return undefined;
  }

  const className = buildClassName(
    'MentionTooltip composer-tooltip custom-scroll',
    transitionClassNames,
  );

  return (
    <div className={className} ref={containerRef}>
      <ListItem
        key="all-users"
        className="chat-item-clickable scroll-item smaller-icon"
        onClick={handleMentionAll}
        focus={selectedMentionIndex === 0}
      >
        <div className="ChatInfo" dir={lang.isRtl ? 'rtl' : undefined}>
          <img src={SerenaPath} alt="mention all" className="w-[34px] h-34px rounded-full mr-[0.7em]" />
          <div className="info">
            <div className="info-name-title">
              Mention All
            </div>
          </div>
        </div>
      </ListItem>
      {renderedChatMembers?.map(({ id }, index) => (
        <ListItem
          key={id}
          className="chat-item-clickable scroll-item smaller-icon"
          onClick={handleClick}
          clickArg={id}
          focus={selectedMentionIndex === index + 1}
        >
          <PrivateChatInfo
            userId={id}
            avatarSize="small"
            withUsername
          />
        </ListItem>
      ))}
    </div>
  );
};

export default memo(MentionTooltip);
