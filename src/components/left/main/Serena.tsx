/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useRef } from '../../../lib/teact/teact';

import buildStyle from '../../../util/buildStyle';

import { AVATAR_SIZES } from '../../common/Avatar';
import ListItem from '../../ui/ListItem';

import SerenaPath from '../../../assets/serena.png';

interface IProps {
  offsetTop: number;
  onClick: () => void;
}
const Serena = (props:IProps) => {
  const { offsetTop, onClick } = props;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <ListItem
      ref={ref}
      className="Chat chat-item-clickable"
      style={`top: ${offsetTop}px`}
      onClick={onClick}
      withPortalForMenu
    >
      <div className="status status-clickable">
        <div className="Avatar" style={buildStyle(`--_size: ${AVATAR_SIZES.large}px;`)}>
          <div className="inner">
            <img className="Avatar__media avatar-media opacity-transition slow open shown" src={SerenaPath} alt="Tely AI" />
          </div>
        </div>
      </div>
      <div className="info">
        <div className="info-row">
          <div className="title">Tely AI</div>
        </div>
      </div>
    </ListItem>
  );
};

export default Serena;
