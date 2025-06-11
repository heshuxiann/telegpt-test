/* eslint-disable max-len */
import React, { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import { selectCurrentChat } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

import ListItem from '../../ui/ListItem';

import SerenaPath from '../assets/serena.png';

const ChatSerena = ({ isSelected }:{ isSelected: boolean }) => {
  const { openChat } = getActions();
  const chatClassName = buildClassName(
    'Chat chat-item-clickable',
    isSelected && 'selected',
  );
  const handleClick = () => {
    openChat({ id: GLOBAL_SUMMARY_CHATID });
  };
  return (
    <ListItem
      className={chatClassName}
      key={GLOBAL_SUMMARY_CHATID}
      style="top: 0px"
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
