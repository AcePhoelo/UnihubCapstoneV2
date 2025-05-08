import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Notification from './Notification';
import ConfirmDialog from './ConfirmDialog';
import './Notification.css';
import './ConfirmDialog.css';
import { cos } from 'prelude-ls';
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);


  const showNotification = useCallback((type, message, title, options = {}) => {
    const id = uuidv4();
    const newNotification = {
      id,
      type,
      message,
      title,
      options
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const closeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((message, title, options) => {
    return showNotification('success', message, title, options);
  }, [showNotification]);

  const info = useCallback((message, title, options) => {
    return showNotification('info', message, title, options);
  }, [showNotification]);
  
  const warning = useCallback((message, title, options) => {
    return showNotification('warning', message, title, options);
  }, [showNotification]);
  
  const error = useCallback((message, title, options) => {
    return showNotification('error', message, title, options);
  }, [showNotification]);

    // New method for confirmation dialogs
  const confirm = useCallback((message, title = 'Confirmation') => {
        return new Promise((resolve) => {
          setConfirmDialog({
            title,
            message,
            onConfirm: () => {
              setConfirmDialog(null);
              resolve(true);
            },
            onCancel: () => {
              setConfirmDialog(null);
              resolve(false);
            }
          });
        });
      }, []);

return (
    <NotificationContext.Provider value={{ 
      showNotification, closeNotification, success, info, warning, error, confirm 
    }}>
      {children}
      <div className="notifications-wrapper">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={() => closeNotification(notification.id)}
            {...notification.options}
          />
        ))}
      </div>
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

