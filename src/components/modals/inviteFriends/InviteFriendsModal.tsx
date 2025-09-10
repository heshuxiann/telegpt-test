import React, { memo, useCallback } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import LinkIcon from '../../../components/chatAssistant/assets/invite/link.svg';
import UserGroupIcon from '../../../components/chatAssistant/assets/invite/user-group.svg';
import HeaderBg from '../../chatAssistant/assets/share-header-bg.png';

import Icon from '../../common/icons/Icon';
import Modal from '../../ui/Modal';

import styles from './InviteFriendsModal.module.scss';

export type OwnProps = {
  modal: TabState['inviteFriendsModal'];
};

const InviteFriendsModal = ({ modal }: OwnProps) => {
  const { closeInviteFriendsModal } = getActions();

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
        <img src={HeaderBg} alt="" />
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
            <span className="font-bold">AvumE2m</span>
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
          <table role="table" aria-label="Codes, Invitees, Credits and Time">
            <thead className="h-[36px] bg-[#F6F6F6]">
              <tr role="row">
                <th role="columnheader">Codes</th>
                <th role="columnheader">Invitees</th>
                <th role="columnheader">Credits</th>
                <th role="columnheader">Time</th>
              </tr>
            </thead>

            <tbody>
              <tr role="row">
                <td data-label="Codes">ABC123</td>
                <td data-label="Invitees">alice@example.com, bob@example.com</td>
                <td data-label="Credits" data-align="right">12</td>
                <td data-label="Time"><span>2025-09-08 20:00 UTC</span></td>
              </tr>

              <tr role="row">
                <td data-label="Codes">XYZ789</td>
                <td data-label="Invitees">charlie@example.com</td>
                <td data-label="Credits" data-align="right">5</td>
                <td data-label="Time"><span>2025-09-09 09:30 GMT+8</span></td>
              </tr>

              <tr role="row">
                <td data-label="Codes">MEET42</td>
                <td data-label="Invitees">team@example.com</td>
                <td data-label="Credits" data-align="right">20</td>
                <td data-label="Time"><span>2025-09-10 15:00 America/New_York</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </Modal>
  );
};

export default memo(InviteFriendsModal);
