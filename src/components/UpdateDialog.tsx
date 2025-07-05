import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface UpdateDialogProps {
  visible: boolean;
  onClose: () => void;
  serverVersion: string;
}

const UPDATE_URL = 'https://drive.google.com/drive/folders/1036zB-50J95EKJ6WsCJiSg0buaLUQopr';

export const UpdateDialog: React.FC<UpdateDialogProps> = ({ 
  visible, 
  onClose,
  serverVersion 
}) => {
  const handleUpdate = async () => {
    try {
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(UPDATE_URL);
      
      if (canOpen) {
        // Open the update URL
        await Linking.openURL(UPDATE_URL);
      } else {
        console.error('Cannot open URL:', UPDATE_URL);
      }
    } catch (error) {
      console.error('Error opening update URL:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>New Update Available</Text>
          
          <Text style={styles.message}>
            A new version ({serverVersion}) of the app is available. Would you like to update now?
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxWidth: 400
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center'
  },
  updateButton: {
    backgroundColor: '#6200ee',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center'
  }
});