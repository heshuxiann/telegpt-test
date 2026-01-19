import type { GlobalState } from '../global/types';
import type { OldLangFn } from './useOldLang';

import useBrowserOnline from './window/useBrowserOnline';
import useFlag from './useFlag';

export enum ConnectionStatus {
  waitingForNetwork,
  syncing,
  online,
  offline,
}

type ConnectionStatusPosition =
  'overlay'
  | 'minimized'
  | 'middleHeader'
  | 'none';

export default function useConnectionStatus(
  lang: OldLangFn,
  connectionState: GlobalState['connectionState'],
  isSyncing: boolean | undefined,
  hasMiddleHeader: boolean,
  isMinimized?: boolean,
  isDisabled?: boolean,
) {
  let status: ConnectionStatus;
  const [connectionStatusOpen, openConnectionStatus, closeConnectionStatus] = useFlag();
  const isBrowserOnline = useBrowserOnline();
  if (!isBrowserOnline) {
    status = ConnectionStatus.offline;
    openConnectionStatus();
  } else if (connectionState === 'connectionStateConnecting') {
    status = ConnectionStatus.waitingForNetwork;
    openConnectionStatus();
  } else if (isSyncing) {
    status = ConnectionStatus.syncing;
  } else {
    status = ConnectionStatus.online;
    closeConnectionStatus();
  }

  let position: ConnectionStatusPosition;
  if (status === ConnectionStatus.online || isDisabled) {
    position = 'none';
  } else if (hasMiddleHeader) {
    position = 'middleHeader';
  } else if (isMinimized) {
    position = 'minimized';
  } else {
    position = 'overlay';
  }

  let text: string | undefined;
  if (status === ConnectionStatus.waitingForNetwork || status === ConnectionStatus.offline) {
    text = lang('WaitingForNetwork');
  } else if (status === ConnectionStatus.syncing) {
    text = lang('Updating');
  }

  if (position === 'middleHeader') {
    text = text!.toLowerCase().replace(/\.+$/, '');
  }

  return {
    connectionStatus: status,
    connectionStatusPosition: position,
    connectionStatusText: text,
    connectionStatusOpen,
    openConnectionStatus,
    closeConnectionStatus,
  };
}
