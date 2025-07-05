import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { Button } from '../common/Button';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Example component demonstrating how to use the notification system
 * This component shows various ways to use toasts and dialogs
 */
const NotificationExample: React.FC = () => {
  const {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    showConfirmationDialog,
    showSuccessDialog,
    showErrorDialog,
    showWarningDialog,
    showDeleteConfirmationDialog,
  } = useNotifications();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Toast Examples</Text>
        <View style={styles.buttonRow}>
          <Button
            onPress={() => showSuccessToast('Operation completed successfully!')}
            style={[styles.button, styles.successButton]}
          >
            Success Toast
          </Button>
          <Button
            onPress={() => showErrorToast('Something went wrong!')}
            style={[styles.button, styles.errorButton]}
          >
            Error Toast
          </Button>
        </View>
        <View style={styles.buttonRow}>
          <Button
            onPress={() => showInfoToast('Here is some information')}
            style={[styles.button, styles.infoButton]}
          >
            Info Toast
          </Button>
          <Button
            onPress={() => showWarningToast('Be careful with this action')}
            style={[styles.button, styles.warningButton]}
          >
            Warning Toast
          </Button>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dialog Examples</Text>
        <Button
          onPress={() =>
            showConfirmationDialog(
              'Confirm Action',
              'Are you sure you want to proceed with this action?',
              () => showSuccessToast('Action confirmed!'),
              () => showInfoToast('Action cancelled')
            )
          }
          style={styles.fullButton}
        >
          Confirmation Dialog
        </Button>
        <Button
          onPress={() =>
            showSuccessDialog(
              'Success',
              'Your profile has been updated successfully!',
              () => console.log('Success dialog closed')
            )
          }
          style={[styles.fullButton, styles.successButton]}
        >
          Success Dialog
        </Button>
        <Button
          onPress={() =>
            showErrorDialog(
              'Error',
              'Failed to connect to the server. Please try again later.',
              () => console.log('Error acknowledged')
            )
          }
          style={[styles.fullButton, styles.errorButton]}
        >
          Error Dialog
        </Button>
        <Button
          onPress={() =>
            showWarningDialog(
              'Warning',
              'This action will log you out of all devices.',
              'Continue',
              'Cancel',
              () => showSuccessToast('Logged out of all devices'),
              () => showInfoToast('Action cancelled')
            )
          }
          style={[styles.fullButton, styles.warningButton]}
        >
          Warning Dialog
        </Button>
        <Button
          onPress={() =>
            showDeleteConfirmationDialog('User Account', () =>
              showSuccessToast('Account deleted')
            )
          }
          style={[styles.fullButton, styles.deleteButton]}
        >
          Delete Confirmation
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullButton: {
    marginBottom: 12,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
});

export default NotificationExample;