import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './FullscreenModal.css';

export default function FullscreenModal({ isOpen, onClose, title, children }) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fullscreen-modal-overlay" onClick={onClose}>
      <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="fullscreen-modal-header">
          <h2 className="fullscreen-modal-title">{title}</h2>
          <button className="fullscreen-modal-close" onClick={onClose} aria-label="Close fullscreen">
            <X size={24} />
          </button>
        </div>
        <div className="fullscreen-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
