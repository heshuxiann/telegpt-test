import { getActions, getGlobal } from '../global';

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
