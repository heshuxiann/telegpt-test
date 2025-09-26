/* eslint-disable no-null/no-null */
import React, { memo, useCallback, useEffect, useRef, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import LinkIcon from '../../../components/chatAssistant/assets/invite/link.svg';
import UserGroupIcon from '../../../components/chatAssistant/assets/invite/user-group.svg';
import { injectComponent } from '../../chatAssistant/injectComponent';
import { getMyInvitation } from '../../chatAssistant/utils/telegpt-api';

import Icon from '../../common/icons/Icon';
import Modal from '../../ui/Modal';
import { InviteCode } from './InviteCode';

import styles from './InviteFriendsModal.module.scss';

export type OwnProps = {
  modal: TabState['inviteFriendsModal'];
};

const InviteFriendsModal = ({ modal }: OwnProps) => {
  const { closeInviteFriendsModal } = getActions();
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>();
  const injectElement = injectComponent({
    component: InviteCode,
  });
  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (contentRef.current) {
      // 类型断言确保 ref 是 HTMLElement
      injected = injectElement(contentRef.current as HTMLElement);
    }
    return () => {
      injected?.unmount();
    };
  }, [injectElement]);

  const getMyInvitationInfo = () => {
    getMyInvitation().then((res) => {
      if (res.code === 0) {
        setMyInviteCode(res.data.inviteCode);
      }
    });
  };

  useEffect(() => {
    if (modal?.isOpen) {
      const cachedInvitation = localStorage.getItem('user-invitation');
      const invitation = cachedInvitation ? JSON.parse(cachedInvitation) : {};
      if (invitation?.inviteCode) {
        setMyInviteCode(invitation.inviteCode);
      } else {
        getMyInvitationInfo();
      }
    }
  }, [modal?.isOpen]);

  const handleClose = useCallback(() => {
    closeInviteFriendsModal();
  }, [closeInviteFriendsModal]);

  if (!modal?.isOpen) {
    return undefined;
  }

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={handleClose}
      className={styles.modal}
    >
      <div className={styles.header}>
        {/* <img src={HeaderBg} alt="" /> */}
        <div className={styles.headerBadge}></div>
        <Icon className="text-[18px] cursor-pointer z-10 mt-[1rem]" name="close" onClick={handleClose} />
      </div>
      <div className={styles.content}>
        <div className="flex flex-col gap-[12px]">
          <div className="flex items-center gap-[10px]">
            <img className="w-[20px] h-[20px]" src={LinkIcon} alt="" />
            <span className="text-[16px] text-[var(--color-text)] font-semibold">
              My Code
            </span>
          </div>
          <div className="text-[var(--color-text-secondary)] text-[14px]">
            This is your exclusive invitation code, it has already been linked to your account.
          </div>
          <div className="text-[14px] text-[var(--color-text)]">
            <span className="font-bold">{myInviteCode}</span>
            <span>(Used by my account)</span>
          </div>
        </div>
        <div className="flex flex-col gap-[12px] mt-[18px]">
          <div className="flex items-center gap-[10px]">
            <img className="w-[20px] h-[20px]" src={UserGroupIcon} alt="" />
            <span className="text-[16px] text-[var(--color-text)] font-semibold">
              Get Credits for Inviting Friends
            </span>
          </div>
          <div className="text-[var(--color-text-secondary)] text-[14px]">
            Share the invitation codes below with your friends! When a new user signs up and uses your invitation code, both you and the invitee will each receive a 100 credit bonus.
          </div>
          <div ref={contentRef}></div>
        </div>

      </div>
    </Modal>
  );
};

export default memo(InviteFriendsModal);
