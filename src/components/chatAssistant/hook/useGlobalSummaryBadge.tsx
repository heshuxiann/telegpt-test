import { useEffect, useState } from '../../../lib/teact/teact';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

import useLastCallback from '../../../hooks/useLastCallback';

export function useGlobalSummaryBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const updateUnreadCount = useLastCallback((param:{ chatId:string; count:number }) => {
    if (param.chatId === GLOBAL_SUMMARY_CHATID) {
      setUnreadCount(param.count);
    }
  });
  useEffect(() => {
    const roomAIData = localStorage.getItem('room-ai-data');
    const count = roomAIData ? JSON.parse(roomAIData)?.[GLOBAL_SUMMARY_CHATID]?.unreadCount || 0 : 0;
    setUnreadCount(count);
    eventEmitter.on(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
    return () => {
      eventEmitter.off(Actions.UpdateRoomAIUnreadCount, updateUnreadCount);
    };
  }, []);
  return unreadCount;
}
