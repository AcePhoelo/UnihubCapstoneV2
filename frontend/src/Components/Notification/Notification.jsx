import React, { useEffect } from 'react';
import './Notification.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleCheck, 
  faCircleInfo, 
  faCircleExclamation,
  faCircleXmark,
  faXmark 
} from '@fortawesome/free-solid-svg-icons';

const Notification = ({ 
  type = 'success', 
  title,
  message, 
  onClose, 
  autoClose = true,
  duration = 10000 
}) => {
  // Auto-close the notification after duration
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  // Set default title based on type if not provided
  const getDefaultTitle = () => {
    switch (type) {
      case 'success': return 'Success';
      case 'info': return 'Info';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Notification';
    }
  };

  const notificationTitle = title || getDefaultTitle();

  // Choose icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success': return faCircleCheck;
      case 'info': return faCircleInfo;
      case 'warning': return faCircleExclamation;
      case 'error': return faCircleXmark;
      default: return faCircleInfo;
    }
  };

  return (
    <div className={`notification-container ${type}`}>
      <div className="notification-icon">
        <FontAwesomeIcon icon={getIcon()} />
      </div>
      <div className="notification-content">
        <div className="notification-title">{notificationTitle}</div>
        <div className="notification-message">{message}</div>
      </div>
      <button className="notification-close" onClick={onClose}>
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
};

export default Notification;