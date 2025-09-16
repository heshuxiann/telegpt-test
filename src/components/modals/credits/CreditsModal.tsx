import React from '@teact';
import { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { GlobalState, TabState } from '../../../global/types';

import useLastCallback from '../../../hooks/useLastCallback';

import Modal from '../../ui/Modal';

import styles from './CreditsModal.module.scss';

export type OwnProps = {
  modal: TabState['creditsModal'];
};

interface StateProps {
  credits?: GlobalState['credits'];
}
const CreditsModal = ({ modal, credits }: OwnProps & StateProps) => {
  const { closeCreditsModal } = getActions();

  const handleClose = useLastCallback(() => {
    closeCreditsModal();
  });

  return (
    <Modal
      isOpen={Boolean(modal?.isOpen)}
      contentClassName={styles.content}
      title="Credits Detail"
      hasCloseButton
      onClose={handleClose}
    >
      <table className={styles.table} role="table" aria-label="Codes, Invitees, Credits and Time">
        <thead className="h-[36px] bg-[#F6F6F6] dark:bg-[var(--color-background)]">
          <tr role="row">
            <th role="columnheader">Detail</th>
            <th role="columnheader">Date</th>
            <th role="columnheader">Credits change</th>
          </tr>
        </thead>
        <tbody>
          {!credits || credits.pointsHistory?.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-[var(--color-text-secondary)] py-4">
                No Data
              </td>
            </tr>
          ) : (
            credits.pointsHistory?.map((item: any) => {
              return (
                <tr role="row">
                  <td data-label="Detail">{item.sourceDescription}</td>
                  <td data-label="Invitees">{new Date(item.createdAt).toLocaleString()}</td>
                  <td data-label="Credits">{item.amount}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Modal>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { credits } = global;

    return {
      credits,
    };
  },
)(CreditsModal));
