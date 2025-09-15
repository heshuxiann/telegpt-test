/* eslint-disable no-null/no-null */
import cx from 'classnames';
import copy from 'copy-to-clipboard';
import React, { memo, useCallback, useEffect, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import LinkIcon from '../../../components/chatAssistant/assets/invite/link.svg';
import UserGroupIcon from '../../../components/chatAssistant/assets/invite/user-group.svg';
import HeaderBg from '../../chatAssistant/assets/share-header-bg.png';
import { getAllInviteInfo } from '../../chatAssistant/utils/telegpt-api';

import Icon from '../../common/icons/Icon';
import Modal from '../../ui/Modal';
import Spinner from '../../ui/Spinner';

import styles from './InviteFriendsModal.module.scss';

export type OwnProps = {
  modal: TabState['inviteFriendsModal'];
};

interface InviteInfo {
  myInvitation: {
    inviteCode: string;
    inviterId: string;
    invitedAt: string;
  };
  myInviteCodes: {
    inviteCode: string;
    invitedUser: string;
    invitedUserName: string;
    points: number;
    invitedAt: string;
    status: 'available' | 'used';
  }[];
}

const InviteFriendsModal = ({ modal }: OwnProps) => {
  const { closeInviteFriendsModal } = getActions();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (modal?.isOpen) {
      getAllInviteInfo().then((res) => {
        if (res.code === 0) {
          setInviteInfo(res.data);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [modal?.isOpen]);

  const handleClose = useCallback(() => {
    closeInviteFriendsModal();
  }, [closeInviteFriendsModal]);

  const handleCopy = (code: string) => {
    copy(code);
    getActions().showNotification({
      message: 'TextCopied',
    });
  };

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
            <span className="font-bold">{inviteInfo?.myInvitation.inviteCode}</span>
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
          <table className={styles.table} role="table" aria-label="Codes, Invitees, Credits and Time">
            <thead className="h-[36px] bg-[#F6F6F6] dark:bg-[var(--color-background)]">
              <tr role="row">
                <th role="columnheader">Codes</th>
                <th role="columnheader">Invitees</th>
                <th role="columnheader">Credits</th>
                <th role="columnheader">Time</th>
              </tr>
            </thead>

            <tbody>
              {
                loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      <Spinner />
                    </td>
                  </tr>
                ) : (
                  inviteInfo?.myInviteCodes.map((item) => {
                    return (
                      <tr role="row">
                        <td data-label="Codes">
                          <div
                            className={cx('w-[100px] h-[36px] text-white text-[14px] flex items-center justify-center gap-[6px] rounded-[8px] bg-[#369CFF]', {
                              'bg-[#D6D6D6]': item.status === 'used',
                            })}
                            onClick={() => handleCopy(item.inviteCode)}
                          >
                            <span>{item.inviteCode}</span>
                            <Icon name="copy" className="cursor-pointer text-[18px]" />
                          </div>
                        </td>
                        <td data-label="Invitees">{item.invitedUserName || ''}</td>
                        <td data-label="Credits">{item.points || ''}</td>
                        <td data-label="Time">
                          {item.invitedAt ? new Date(item.invitedAt).toLocaleString() : ''}
                        </td>
                      </tr>
                    );
                  })
                )
              }
            </tbody>
          </table>
        </div>

      </div>
    </Modal>
  );
};

export default memo(InviteFriendsModal);
