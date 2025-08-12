import React, { type ReactNode } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position: { x: number; y: number } | null;
  className?: string;
  showOverlay?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  position,
  className = '',
  showOverlay = true,
}) => {
  if (!isOpen) return null;

  const modalStyle = position
    ? {
        position: 'fixed' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }
    : {};

  return (
    <>
      {showOverlay && <div className="modal-overlay" onClick={onClose}></div>}
      <div className={`modal-content ${className}`} style={modalStyle}>
        {children}
      </div>
    </>
  );
};

export default Modal;
