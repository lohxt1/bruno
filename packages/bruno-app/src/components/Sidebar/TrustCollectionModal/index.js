import Modal from 'components/Modal/index';
import Portal from 'components/Portal/index';

const TrustCollectionModal = ({ onSubmit, onClose }) => {
  return (
    <Portal>
      <Modal size="md" title=" " confirmText="Yes" handleConfirm={onSubmit} cancelText="No" handleCancel={onClose}>
        <div className="px-4">
          <div className="text-lg mb-4">Do you trust this collection?</div>
          <div className="text-sm">
            You are adding a collection that is not currently trusted. Do you trust the contents of this collection and
            it's authors?
          </div>
        </div>
      </Modal>
    </Portal>
  );
};

export default TrustCollectionModal;
