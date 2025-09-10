import React, { useState } from '../../../../lib/teact/teact';

import GuidanceWrapper from './guidance-wrapper';

import useLastCallback from '../../../../hooks/useLastCallback';

import Modal from '../../../ui/Modal';

import './guidance.scss';

const GuidanceModal = () => {
  const telegptGuidance = localStorage.getItem('telegpt-guidance') === 'true';
  const [isFirstIn, setIsFirstIn] = useState<boolean>(!telegptGuidance);
  const handleClose = useLastCallback(() => {
    localStorage.setItem('telegpt-guidance', 'true');
    setIsFirstIn(false);
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
