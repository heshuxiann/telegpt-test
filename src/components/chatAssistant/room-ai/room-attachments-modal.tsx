import React from '../../../lib/teact/teact';

import useLastCallback from '../../../hooks/useLastCallback';

import Modal from '../../ui/Modal';

interface OwnProps {
  isOpen: boolean;
  children?: React.ReactNode;
}
const RoomAttachmentsModal = ({ isOpen, children }:OwnProps) => {
  const handleClose = useLastCallback(() => {});
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
    >
      {children}
    </Modal>
  );
};

export default RoomAttachmentsModal;
