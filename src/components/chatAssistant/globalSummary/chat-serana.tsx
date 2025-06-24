/* eslint-disable max-len */
import React, { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import { selectCurrentChat } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { useGlobalSummaryBadge } from '../hook/useGlobalSummaryBadge';
import { GLOBAL_SUMMARY_CHATID } from '../variables';
import GlobalSummaryBadge from './global-summary-badge';

import ListItem from '../../ui/ListItem';
import ShowTransition from '../../ui/ShowTransition';

import SerenaPath from '../assets/serena.png';

interface StateProps {
  isSelected: boolean;
}
interface OwnProps {
  frozenNotificationHeight: number;
  archiveHeight: number;
  unconfirmedSessionHeight: number;
}
const ChatSerena = (props: OwnProps & StateProps) => {
  const {
    isSelected,
    frozenNotificationHeight,
    archiveHeight,
    unconfirmedSessionHeight,
  } = props;
  const offsetTop = frozenNotificationHeight + archiveHeight + unconfirmedSessionHeight;
  const { openChat, setShouldCloseRightColumn } = getActions();
  const chatClassName = buildClassName(
    'Chat chat-item-clickable',
    isSelected && 'selected',
  );
  const unreadCount = useGlobalSummaryBadge();
  const handleClick = () => {
    setShouldCloseRightColumn({ value: true });
    openChat({ id: GLOBAL_SUMMARY_CHATID });
    GlobalSummaryBadge.updateRoomData('unreadCount', 0);
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
      <img className="w-[54px] h-[54px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
      <div className="info">
        <div className="info-row">
          <div className="title FullNameTitle-module__root">
            <h3 dir="auto" role="button" className="fullName FullNameTitle-module__fullName">
              Serena AI
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
    const chat = selectCurrentChat(global);
    const isSelected = GLOBAL_SUMMARY_CHATID === chat?.id;
    return {
      isSelected,
    };
  },
)(ChatSerena));
