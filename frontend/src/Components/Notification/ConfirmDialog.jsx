import React from 'react';
import './ConfirmDialog.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleExclamation,
  faXmark 
} from '@fortawesome/free-solid-svg-icons';

const ConfirmDialog = ({ 
  title = 'Confirmation',
  message, 
  onConfirm,
  onCancel
}) => {
  return (
    <>
      <div className="confirm-overlay" onClick={onCancel}></div>
      <div className="confirm-container warning">
        <div className="confirm-icon">
          <FontAwesomeIcon icon={faCircleExclamation} />
        </div>
        <div className="confirm-content">
          <div className="confirm-title">{title}</div>
          <div className="confirm-message">{message}</div>
          <div className="confirm-buttons">
            <button className="confirm-button cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="confirm-button confirm" onClick={onConfirm}>
              Confirm
            </button>
          </div>
        </div>
        <button className="confirm-close" onClick={onCancel}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </>
  );
};

export default ConfirmDialog;