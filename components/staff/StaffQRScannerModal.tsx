import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { X, QrCode, UserPlus, Upload, Camera } from 'lucide-react-native';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { toast } from 'sonner-native';
import jsQR from 'jsqr';

interface StaffQRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

interface ScannedStaffData {
  staffId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  timestamp: string;
}

const StaffQRScannerModal: React.FC<StaffQRScannerModalProps> = ({
  visible,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedStaffData | null>(null);
  const [showOptions, setShowOptions] = useState(true);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
      setShowOptions(true);
      setShowCamera(false);
    }
  }, [visible]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('📱 QR Code scanned:', data);
    processQRData(data);
  };

  const processQRData = async (data: string) => {
    try {
      // Parse the QR code data
      const staffData: ScannedStaffData = JSON.parse(data);
      console.log('✅ Parsed staff data:', staffData);

      // Validate the data structure
      if (!staffData.staffId || !staffData.email || !staffData.firstName) {
        throw new Error('Invalid QR code format');
      }

      setScannedData(staffData);

      // Show confirmation dialog
      Alert.alert(
        'Assign Staff Member',
        `Do you want to assign ${staffData.firstName} ${staffData.lastName} (${staffData.role}) to your organization?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setScannedData(null);
              setShowOptions(true);
              setShowCamera(false);
            },
          },
          {
            text: 'Assign',
            onPress: () => assignStaffToClient(staffData),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error parsing QR code:', error);
      Alert.alert(
        'Invalid QR Code',
        'The scanned QR code is not a valid staff assignment code.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setScannedData(null);
              setShowOptions(true);
              setShowCamera(false);
            },
          },
        ]
      );
    }
  };

  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permission to upload QR code images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setIsAssigning(true);
        const imageUri = result.assets[0].uri;
        console.log('📷 Image selected:', imageUri);

        // Decode QR code from image
        await decodeQRFromImage(imageUri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsAssigning(false);
    }
  };

  const decodeQRFromImage = async (imageUri: string) => {
    try {
      // Create a canvas to read the image
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        // Create an image element
        const img = new window.Image();
        img.src = base64data;
        
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Decode QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          setIsAssigning(false);
          
          if (code) {
            console.log('✅ QR Code decoded from image:', code.data);
            processQRData(code.data);
          } else {
            Alert.alert(
              'No QR Code Found',
              'Could not find a valid QR code in the selected image. Please try again with a clearer image.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowOptions(true);
                    setShowCamera(false);
                  },
                },
              ]
            );
          }
        };
        
        img.onerror = () => {
          setIsAssigning(false);
          Alert.alert('Error', 'Failed to load image. Please try again.');
        };
      };
      
      reader.onerror = () => {
        setIsAssigning(false);
        Alert.alert('Error', 'Failed to read image. Please try again.');
      };
    } catch (error) {
      console.error('❌ Error decoding QR from image:', error);
      setIsAssigning(false);
      Alert.alert(
        'Error',
        'Failed to decode QR code from image. Please try scanning with camera instead.'
      );
    }
  };

  const assignStaffToClient = async (staffData: ScannedStaffData) => {
    setIsAssigning(true);
    try {
      console.log('🚀 Assigning staff to client...');
      console.log('Staff ID:', staffData.staffId);
      console.log('Client ID:', clientId);

      // Call the assign-client API
      // Note: (users) is a route group in Next.js and doesn't appear in the URL
      const response = await axios.post(
        `${domain}/api/users/staff/assign-client`,
        {
          staffId: staffData.staffId,
          clientIds: [clientId],
        }
      );

      console.log('✅ Assignment response:', response.data);

      const responseData = response.data as { success?: boolean; message?: string };

      if (responseData.success) {
        toast.success(
          `${staffData.firstName} ${staffData.lastName} has been assigned successfully!`
        );
        onSuccess(); // Refresh the staff list
        onClose(); // Close the modal
      } else {
        throw new Error(responseData.message || 'Assignment failed');
      }
    } catch (error: any) {
      console.error('❌ Error assigning staff:', error);
      
      let errorMessage = 'Failed to assign staff member';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Assignment Failed', errorMessage, [
        {
          text: 'OK',
          onPress: () => {
            setScanned(false);
            setScannedData(null);
          },
        },
      ]);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    if (!isAssigning) {
      setScanned(false);
      setScannedData(null);
      setShowOptions(true);
      setShowCamera(false);
      onClose();
    }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant camera permission to scan QR codes.'
        );
        return;
      }
    }
    setShowOptions(false);
    setShowCamera(true);
  };

  // Show options screen first
  if (showOptions && !showCamera) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.overlay}>
          <View style={styles.optionsContainer}>
            {/* Header */}
            <View style={styles.optionsHeader}>
              <View style={styles.headerLeft}>
                <QrCode size={24} color="#3B82F6" />
                <Text style={styles.optionsHeaderTitle}>Scan QR Code</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isAssigning}
                style={styles.closeIconButton}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <View style={styles.optionsContent}>
              <Text style={styles.optionsDescription}>
                Choose how you want to scan the staff QR code
              </Text>

              {/* Camera Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleOpenCamera}
                disabled={isAssigning}
              >
                <View style={styles.optionIconContainer}>
                  <Camera size={32} color="#3B82F6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Scan with Camera</Text>
                  <Text style={styles.optionDescription}>
                    Use your device camera to scan QR code
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Upload Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handlePickImage}
                disabled={isAssigning}
              >
                <View style={styles.optionIconContainer}>
                  <Upload size={32} color="#8B5CF6" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Upload from Gallery</Text>
                  <Text style={styles.optionDescription}>
                    Select a QR code image from your device
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Loading overlay */}
            {isAssigning && (
              <View style={styles.loadingOverlayOptions}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Processing QR code...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // Show loading while checking permissions
  if (!permission && showCamera) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </Modal>
    );
  }

  // Show permission request screen
  if (!permission?.granted && showCamera) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <QrCode size={64} color="#EF4444" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              Please grant camera permission to scan QR codes
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={async () => {
                const result = await requestPermission();
                if (!result.granted) {
                  handleClose();
                }
              }}
            >
              <Text style={styles.closeButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.closeButton, styles.secondaryCloseButton]} 
              onPress={handleClose}
            >
              <Text style={styles.secondaryCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <QrCode size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Scan Staff QR Code</Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isAssigning}
            style={styles.closeIconButton}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          
          {/* Scanning overlay */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              {scanned
                ? 'Processing...'
                : 'Position the QR code within the frame'}
            </Text>
          </View>
        </View>

        {/* Loading overlay */}
        {isAssigning && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingCardText}>Assigning staff member...</Text>
            </View>
          </View>
        )}

        {/* Rescan button */}
        {scanned && !isAssigning && (
          <View style={styles.rescanContainer}>
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => {
                setScanned(false);
                setScannedData(null);
              }}
            >
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rescanButton, styles.backButton]}
              onPress={() => {
                setScanned(false);
                setScannedData(null);
                setShowOptions(true);
                setShowCamera(false);
              }}
            >
              <Text style={styles.backButtonText}>Back to Options</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionsHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  optionsContent: {
    padding: 20,
  },
  optionsDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  loadingOverlayOptions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#1F2937',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeIconButton: {
    padding: 4,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryCloseButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryCloseButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rescanContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rescanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  rescanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffQRScannerModal;
