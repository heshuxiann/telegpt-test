import { getActions, getGlobal, setGlobal } from '../global';

import type { GlobalState } from '../global/types';

/**
 * 处理支付相关错误码的函数
 * @param res API响应对象
 */
export function handlePaymentError(res: any) {
  if (res && (res.code === 102 || res.code === 103)) {
    const { openPayPackageModal } = getActions();
    openPayPackageModal?.();
  }
}
export function checkCredisBalance() {
  const { subscriptionInfo } = getGlobal();
  return subscriptionInfo?.creditBalance > 0 && !subscriptionInfo?.isExpirated;
}

// 更新用户会员信息
export function updateUserSubscriptionInfo(subscriptionInfo: GlobalState['subscriptionInfo']) {
  let global = getGlobal();
  global = {
    ...global,
    subscriptionInfo,
  };
  setGlobal(global);
}
