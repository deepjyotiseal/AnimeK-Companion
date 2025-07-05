import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type DialogType = 'info' | 'success' | 'warning' | 'error';

/**
 * A custom hook that provides simplified access to toast and dialog notifications
 * with common preset configurations for the application.
 */
export const useNotifications = () => {
  const { showToast, showDialog, hideToast, hideDialog } = useNotification();

  // Success toast with default duration
  const showSuccessToast = useCallback(
    (message: string, duration = 3000) => {
      showToast({
        message,
        type: 'success',
        duration,
      });
    },
    [showToast]
  );

  // Error toast with longer default duration
  const showErrorToast = useCallback(
    (message: string, duration = 5000) => {
      showToast({
        message,
        type: 'error',
        duration,
      });
    },
    [showToast]
  );

  // Info toast
  const showInfoToast = useCallback(
    (message: string, duration = 3000) => {
      showToast({
        message,
        type: 'info',
        duration,
      });
    },
    [showToast]
  );

  // Warning toast
  const showWarningToast = useCallback(
    (message: string, duration = 4000) => {
      showToast({
        message,
        type: 'warning',
        duration,
      });
    },
    [showToast]
  );

  // Confirmation dialog with yes/no options
  const showConfirmationDialog = useCallback(
    (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
      showDialog({
        title,
        message,
        type: 'info',
        confirmText: 'Yes',
        cancelText: 'No',
        onConfirm,
        onCancel,
      });
    },
    [showDialog]
  );

  // Success dialog
  const showSuccessDialog = useCallback(
    (title: string, message: string, onConfirm?: () => void) => {
      showDialog({
        title,
        message,
        type: 'success',
        confirmText: 'OK',
        onConfirm,
      });
    },
    [showDialog]
  );

  // Error dialog
  const showErrorDialog = useCallback(
    (title: string, message: string, onConfirm?: () => void) => {
      showDialog({
        title,
        message,
        type: 'error',
        confirmText: 'OK',
        onConfirm,
      });
    },
    [showDialog]
  );

  // Warning dialog with custom action buttons
  const showWarningDialog = useCallback(
    (title: string, message: string, confirmText: string, cancelText: string, onConfirm: () => void, onCancel?: () => void) => {
      showDialog({
        title,
        message,
        type: 'warning',
        confirmText,
        cancelText,
        onConfirm,
        onCancel,
      });
    },
    [showDialog]
  );

  // Delete confirmation dialog
  const showDeleteConfirmationDialog = useCallback(
    (itemName: string, onConfirm: () => void) => {
      showDialog({
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
        type: 'warning',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm,
      });
    },
    [showDialog]
  );

  return {
    // Base functions
    showToast,
    hideToast,
    showDialog,
    hideDialog,
    
    // Toast shortcuts
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    
    // Dialog shortcuts
    showConfirmationDialog,
    showSuccessDialog,
    showErrorDialog,
    showWarningDialog,
    showDeleteConfirmationDialog,
  };
};