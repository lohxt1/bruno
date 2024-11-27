import React from 'react';
import { useSelector } from 'react-redux';
import Modal from 'components/Modal';

const UpdaterModal = ({ onClose, updateNow }) => {
  const latestVersion = useSelector((state) => state.app.autoUpdate.latestVersion);

  return (
    <Modal
      title="Update Available"
      size="sm"
      handleCancel={onClose}
      handleConfirm={updateNow}
      confirmText="Restart"
      cancelText="Later"
    >
      <div className="text-center">
        <p className="text-2xl mt-4">{latestVersion}</p>
        <p className="text-lg">A new version has been downloaded. Restart the application to apply the updates.</p>
      </div>
    </Modal>
  );
};

export default UpdaterModal;
