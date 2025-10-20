import React, { useEffect, useState } from '../../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../../global';

import { getMyInvitation } from '../../utils/telegpt-api';
import GuidanceWrapper from './guidance-wrapper';

import useLastCallback from '../../../../hooks/useLastCallback';

import Modal from '../../../ui/Modal';

import './guidance.scss';

const GuidanceModal = () => {
  const telegptGuidance = localStorage.getItem('telegpt-guidance') === 'true';
  const [isFirstIn, setIsFirstIn] = useState<boolean>(!telegptGuidance);

  const checkInvitationStatus = useLastCallback(async () => {
    const global = getGlobal();
    const { currentUserId } = global;
    if (!currentUserId) {
      setTimeout(() => {
        checkInvitationStatus();
      }, 2000);
      return;
    }
    const { openInviteCodeModal } = getActions();
    try {
      // 调用API获取受邀状态
      const invitationData = await getMyInvitation();
      const invitationInfo = invitationData.data;

      // 存储到localStorage
      localStorage.setItem('user-invitation', JSON.stringify(invitationInfo));

      // 如果受邀信息为空，打开邀请码提交弹窗
      if (!invitationInfo) {
        openInviteCodeModal();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to check invitation status:', error);
      // 如果API调用失败，10s后重试
      setTimeout(() => {
        checkInvitationStatus();
      }, 10000);
    }
  });

  useEffect(() => {
    if (!isFirstIn) {
    // 检测用户受邀状态
      checkInvitationStatus();
    }
  }, [isFirstIn]);

  const handleClose = useLastCallback(async () => {
    localStorage.setItem('telegpt-guidance', 'true');
    setIsFirstIn(false);

    // 检测用户受邀状态
    await checkInvitationStatus();
  });

  if (!isFirstIn) {
    return undefined;
  }
  return (
    <Modal
      isOpen
      noBackdropClose
      onClose={handleClose}
      className="guidance-modal"
    >
      <GuidanceWrapper handleClose={handleClose} />
    </Modal>
  );
};

export default GuidanceModal;
