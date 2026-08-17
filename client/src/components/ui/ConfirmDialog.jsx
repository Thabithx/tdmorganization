import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'CONFIRM ACTION',
  message = 'Are you sure you want to perform this action? This cannot be undone.',
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  variant = 'primary',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col space-y-4">
        <p className="text-secondary text-sm leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-frost-50/10">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} size="sm">
            {cancelText}
          </Button>
          <Button variant={variant} onClick={handleConfirm} isLoading={isLoading} size="sm">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
