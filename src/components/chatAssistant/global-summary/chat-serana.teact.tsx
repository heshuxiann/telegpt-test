/* eslint-disable max-len */
import React, { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import { selectCurrentMessageList } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { useGlobalSummaryBadge } from '../hook/useGlobalSummaryBadge';
import RoomStorage from '../room-storage';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

import ListItem from '../../ui/ListItem';
import ShowTransition from '../../ui/ShowTransition';

import SerenaPath from '../assets/serena.png';

interface StateProps {
  isSelected: boolean;
}
interface OwnProps {
  offsetTop: number;
  // frozenNotificationHeight: number;
  // archiveHeight: number;
  // unconfirmedSessionHeight: number;
}
const ChatSerena = (props: OwnProps & StateProps) => {
  const {
    isSelected,
    // frozenNotificationHeight,
    // archiveHeight,
    // unconfirmedSessionHeight,
    offsetTop,
  } = props;
  // const offsetTop = frozenNotificationHeight + archiveHeight + unconfirmedSessionHeight;
  const { openChat } = getActions();
  const chatClassName = buildClassName(
    'Chat chat-item-clickable',
    isSelected && 'selected',
  );
  const unreadCount = useGlobalSummaryBadge();
  const handleClick = () => {
    openChat({ id: GLOBAL_SUMMARY_CHATID });
    RoomStorage.updateRoomAIData(GLOBAL_SUMMARY_CHATID, 'unreadCount', 0);
  };
  return (
    <ListItem
      className={chatClassName}
      key={GLOBAL_SUMMARY_CHATID}
      style={`top: ${offsetTop}px`}
      // eslint-disable-next-line react/jsx-no-bind
      onClick={handleClick}
      withPortalForMenu
    >
      <img className="w-[54px] h-[54px] rounded-full mr-[12px]" src={SerenaPath} alt="TelyAI" />
      <div className="info">
        <div className="info-row">
          <div className="title FullNameTitle-module__root">
            <h3 dir="auto" role="button" className="fullName FullNameTitle-module__fullName">
              TelyAI
            </h3>
          </div>
        </div>
        <div className="subtitle">
          <p className="last-message shared-canvas-container" dir="ltr">
            Chat Summary
          </p>
          <ShowTransition isCustom className="ChatBadge-transition" isOpen={unreadCount > 0}>
            <div className="ChatBadge unread">
              {unreadCount}
            </div>
          </ShowTransition>
        </div>
      </div>
    </ListItem>
  );
};

export default memo(withGlobal(
  (global) => {
    const {
      chatId: currentChatId,
    } = selectCurrentMessageList(global) || {};
    const isSelected = GLOBAL_SUMMARY_CHATID === currentChatId;
    return {
      isSelected,
    };
  },
)(ChatSerena));
