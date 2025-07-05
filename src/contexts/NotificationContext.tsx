import React, { createContext, useState, useContext, ReactNode } from 'react';
import Toast from '../components/common/Toast';
import Dialog from '../components/common/Dialog';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type DialogType = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
  });

  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: DialogType;
    onConfirm?: () => void;
    onCancel?: () => void;
    loading: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'info',
    loading: false,
  });

  const showToast = ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    setToast({
      visible: true,
      message,
      type,
      duration,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const showDialog = ({
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    type = 'info',
    onConfirm,
    onCancel,
  }: DialogOptions) => {
    setDialog({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: onConfirm
        ? () => {
            setDialog((prev) => ({ ...prev, loading: true }));
            onConfirm();
            setTimeout(() => {
              hideDialog();
            }, 300);
          }
        : undefined,
      onCancel: onCancel
        ? () => {
            onCancel();
            hideDialog();
          }
        : () => hideDialog(),
      loading: false,
    });
  };

  const hideDialog = () => {
    setDialog((prev) => ({ ...prev, visible: false, loading: false }));
  };

  return (
    <NotificationContext.Provider value={{ showToast, hideToast, showDialog, hideDialog }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
      <Dialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
        loading={dialog.loading}
      />
    </NotificationContext.Provider>
  );
};