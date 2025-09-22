let lastPayPackageModalTime = 0;
const PAY_PACKAGE_MODAL_THROTTLE_MS = 3 * 60 * 1000; // 3分钟

/**
 * 处理支付相关错误码的函数
 * @param res API响应对象
 */
export async function handlePaymentError(res: any) {
  if (res && (res.code === 102 || res.code === 103)) {
    const now = Date.now();
    if (now - lastPayPackageModalTime >= PAY_PACKAGE_MODAL_THROTTLE_MS) {
      // 动态导入避免服务端渲染时的 window is not defined 错误
      const { getActions } = await import('../global');
      const { openPayPackageModal } = getActions();
      openPayPackageModal();
      lastPayPackageModalTime = now;
    }
  }
}
