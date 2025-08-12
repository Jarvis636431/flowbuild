import React, { type ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  showOverlay?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  showOverlay = true,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {showOverlay && <div className="modal-overlay" onClick={onClose}></div>}
      <div className={`modal-content ${className}`}>{children}</div>
    </>
  );
};

export default Modal;
