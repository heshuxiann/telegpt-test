/* eslint-disable no-console */
import React, { memo, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { TabState } from '../../../global/types';

import HeaderBg from '../../chatAssistant/assets/share-header-bg.png';
import { submitInviteCode } from '../../chatAssistant/utils/telegpt-api';

import Button from '../../ui/Button';
import InputText from '../../ui/InputText';
import Modal from '../../ui/Modal';

import styles from './InviteCodeModal.module.scss';

export interface OwnProps {
  modal: TabState['inviteCodeModal'];
}

const InviteCodeModal = ({ modal }: OwnProps) => {
  const { closeInviteCodeModal } = getActions();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    try {
      submitInviteCode(inviteCode).then((res) => {
        if (res.code === 0) {
          closeInviteCodeModal();
          setError('');
        } else {
          console.log('Failed to submit invite code:', res);
          setError(res.error);
        }
      });
    } catch (error) {
      console.error('Failed to submit invite code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteCode(e.target.value);
  };

  if (!modal?.isOpen) {
    return undefined;
  }

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={() => {}} // 不允许关闭
      className={styles.modal}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <img src={HeaderBg} alt="" />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>Invitation Code</h3>

          <InputText
            value={inviteCode}
            onChange={handleInputChange}
            placeholder="Please enter the invitation code"
            className={styles.input}
          />
          <div className={styles.error}>{error}</div>
          <div className={styles.actions}>
            <Button
              onClick={handleSubmit}
              disabled={!inviteCode.trim() || isSubmitting}
              className={styles.submitButton}
              noForcedUpperCase
            >
              {isSubmitting ? 'Confirm...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(InviteCodeModal);
