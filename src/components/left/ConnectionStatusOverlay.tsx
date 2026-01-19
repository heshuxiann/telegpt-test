import React from '@teact';
import type { FC } from '../../lib/teact/teact';
import { memo } from '../../lib/teact/teact';

import { ConnectionStatus } from '../../hooks/useConnectionStatus';
import useOldLang from '../../hooks/useOldLang';

import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Transition from '../ui/Transition';

import './ConnectionStatusOverlay.scss';

type OwnProps = {
  connectionStatus: ConnectionStatus;
  connectionStatusText: string;
  onClick?: NoneToVoidFunction;
};

const ConnectionStatusOverlay: FC<OwnProps> = ({
  connectionStatus,
  connectionStatusText,
  onClick,
}) => {
  const lang = useOldLang();

  return (
    <div id="ConnectionStatusOverlay" dir={lang.isRtl ? 'rtl' : undefined} onClick={onClick}>
      {connectionStatus !== ConnectionStatus.offline && (
        <Spinner color="black" />
      )}
      {connectionStatus === ConnectionStatus.offline ? (
        <div className="state-text offline">
          <Transition activeKey={connectionStatus} name="slideFade">
            Network unavailable. Please Check your network.
          </Transition>
        </div>
      ) : (
        <div className="state-text">
          <Transition activeKey={connectionStatus} name="slideFade">
            {connectionStatusText}
          </Transition>
        </div>
      )}
      <Button
        round
        size="tiny"
        color="translucent-black"
      >
        <Icon name="close" />
      </Button>
    </div>
  );
};

export default memo(ConnectionStatusOverlay);
