// Revolutionary Notification Center Component
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Typography, Box } from '@mui/material';
import { Close, CheckCircle, Error, Warning, Info } from '@mui/icons-material';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  timestamp: Date;
}

// Notification context
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Show a notification
  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, duration);
    }
  }, []);

  // Show error notification
  const showError = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'error',
      title: title || 'Error Occurred',
      message,
      duration: 0 // Don't auto-dismiss errors
    });
  }, [showNotification]);

  // Show success notification
  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'success',
      title: title || 'Success',
      message
    });
  }, [showNotification]);

  // Show warning notification
  const showWarning = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'warning',
      title: title || 'Warning',
      message
    });
  }, [showNotification]);

  // Show info notification
  const showInfo = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'info',
      title: title || 'Information',
      message
    });
  }, [showNotification]);

  // Dismiss a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Dismiss all notifications
  const dismissAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue = {
    notifications,
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    dismissNotification,
    dismissAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationDisplay 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification display component
const NotificationDisplay = ({ 
  notifications, 
  onDismiss 
}: { 
  notifications: Notification[]; 
  onDismiss: (id: string) => void; 
}) => {
  // Get icon for notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle />;
      case 'error': return <Error />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return null;
    }
  };

  // Get color for notification type
  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <>
      {notifications.map(notification => (
        <Snackbar
          key={notification.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: notifications.indexOf(notification) * 4 }}
        >
          <Alert
            severity={getColor(notification.type)}
            icon={getIcon(notification.type)}
            sx={{ 
              width: '100%', 
              maxWidth: 400,
              backgroundColor: 'background.paper',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            action={
              notification.closable !== false && (
                <IconButton
                  size="small"
                  onClick={() => onDismiss(notification.id)}
                >
                  <Close fontSize="small" />
                </IconButton>
              )
            }
          >
            {notification.title && (
              <AlertTitle sx={{ fontWeight: 'bold', marginTop: 0, marginBottom: 0.5 }}>
                {notification.title}
              </AlertTitle>
            )}
            <Typography variant="body2">
              {notification.message}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {notification.timestamp.toLocaleTimeString()}
              </Typography>
            </Box>
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationProvider;