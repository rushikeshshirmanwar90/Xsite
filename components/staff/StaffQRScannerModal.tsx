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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { X } from 'lucide-react-native';
import axios from 'axios';
import { domain } from '@/lib/domain';
import { toast } from 'sonner-native';

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

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setScannedData(null);
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
            },
          },
        ]
      );
    }
  };

  const handlePickImage = async () => {
    try {
      console.log('📱 Starting image picker...');
      
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library permission to upload QR code images.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // On some platforms, you might want to open app settings
                Alert.alert('Info', 'Please enable photo library access in your device settings.');
              },
            },
          ]
        );
        return;
      }

      console.log('✅ Media library permission granted');

      // Launch image picker with optimized settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8, // Reduce quality for faster processing
        aspect: [1, 1], // Prefer square images for QR codes
        allowsMultipleSelection: false,
      });

      console.log('📷 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize || 0;
        
        console.log('📷 Image selected:', imageUri);
        console.log('� Filge size:', fileSize, 'bytes');
        
        // Check file size (limit to 10MB)
        if (fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'File Too Large',
            'Please select an image smaller than 10MB.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        setIsAssigning(true);
        
        // Add a small delay to show loading state
        setTimeout(async () => {
          try {
            await decodeQRFromImage(imageUri);
          } catch (error) {
            console.error('❌ Error in decodeQRFromImage:', error);
            setIsAssigning(false);
          }
        }, 100);
        
      } else {
        console.log('📷 Image picker cancelled or no image selected');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to pick image. Please try again or use camera scanning instead.',
        [{ text: 'OK' }]
      );
      setIsAssigning(false);
    }
  };

  const decodeQRFromImage = async (imageUri: string) => {
    try {
      console.log('📸 Starting QR code detection from image:', imageUri);
      
      // Resize and optimize image for better QR detection using the new hook-based API
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 800 } }, // Resize to reasonable size
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true, // Get base64 for API upload
        }
      );

      if (!manipulatedImage.base64) {
        throw new Error('Failed to convert image to base64');
      }

      console.log('📸 Image processed, sending to QR detection API...');

      // Use QR Server API for detection
      const qrApiUrl = 'https://api.qrserver.com/v1/read-qr-code/';
      
      // Create form data for the API
      const formData = new FormData();
      formData.append('file', {
        uri: manipulatedImage.uri,
        type: 'image/jpeg',
        name: 'qr-image.jpg',
      } as any);

      console.log('🌐 Sending request to QR detection API...');
      
      const response = await fetch(qrApiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`QR API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📱 QR API response:', result);

      // Check if QR code was detected
      if (result && result[0] && result[0].symbol && result[0].symbol[0] && result[0].symbol[0].data) {
        const qrData = result[0].symbol[0].data;
        console.log('✅ QR code detected:', qrData);
        
        setIsAssigning(false);
        
        // Process the detected QR data
        processQRData(qrData);
        
      } else {
        console.log('❌ No QR code detected in image');
        throw new Error('No QR code found in the image');
      }
      
    } catch (error) {
      console.error('❌ Error decoding QR from image:', error);
      setIsAssigning(false);
      
      // Show helpful error message with options
      Alert.alert(
        'QR Code Not Detected',
        'Could not detect a QR code in the selected image. This could happen if:\n\n• The image quality is too low\n• The QR code is partially obscured\n• The image doesn\'t contain a QR code\n\nPlease try again with a clearer image or use the camera scanner.',
        [
          {
            text: 'Try Another Image',
            onPress: () => {
              handlePickImage();
            },
          },
          {
            text: 'Manual Entry',
            onPress: () => {
              showManualEntryDialog();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const showManualEntryDialog = () => {
    Alert.prompt(
      'Manual Staff Entry',
      'Please enter the Staff ID from the QR code:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: (staffId?: string) => {
            if (staffId && staffId.trim()) {
              // Create a mock QR data structure
              const mockQRData = JSON.stringify({
                staffId: staffId.trim(),
                firstName: 'Staff',
                lastName: 'Member',
                email: '',
                phoneNumber: '',
                role: 'staff',
                timestamp: new Date().toISOString()
              });
              processQRData(mockQRData);
            } else {
              Alert.alert('Error', 'Please enter a valid Staff ID');
            }
          },
        },
      ],
      'plain-text'
    );
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
      onClose();
    }
  };

  // Show loading while checking permissions
  if (!permission) {
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
  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <View style={styles.permissionIcon}>
              <Text style={styles.permissionIconText}>📷</Text>
            </View>
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
        {/* Header with only close button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isAssigning}
            style={styles.closeButtonHeader}
          >
            <X size={28} color="#FFFFFF" />
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
          
          {/* Scanning overlay with transparent center */}
          <View style={styles.scannerOverlay}>
            {/* Top overlay */}
            <View style={styles.overlayTop} />
            
            {/* Middle section with left, center (transparent), and right overlays */}
            <View style={styles.overlayMiddle}>
              <View style={styles.overlayLeft} />
              <View style={styles.scanArea}>
                {/* Top Left - Red */}
                <View style={[styles.corner, styles.topLeft, { borderColor: '#FF6B6B' }]} />
                {/* Top Right - Orange */}
                <View style={[styles.corner, styles.topRight, { borderColor: '#FFB347' }]} />
                {/* Bottom Left - Blue */}
                <View style={[styles.corner, styles.bottomLeft, { borderColor: '#4DABF7' }]} />
                {/* Bottom Right - Green */}
                <View style={[styles.corner, styles.bottomRight, { borderColor: '#51CF66' }]} />
              </View>
              <View style={styles.overlayRight} />
            </View>
            
            {/* Bottom overlay */}
            <View style={styles.overlayBottom} />
          </View>

          {/* Gallery Upload Button */}
          <View style={styles.galleryButtonContainer}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={handlePickImage}
              disabled={isAssigning || scanned}
            >
              <View style={styles.galleryIcon}>
                <View style={styles.galleryIconInner} />
              </View>
              <Text style={styles.galleryButtonText}>Upload from gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading overlay */}
        {isAssigning && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingCardText}>
                {scanned ? 'Assigning staff member...' : 'Detecting QR code...'}
              </Text>
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
          </View>
        )}
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButtonHeader: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: (Dimensions.get('window').height - scanAreaSize) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    width: '100%',
    height: scanAreaSize,
    position: 'absolute',
    top: (Dimensions.get('window').height - scanAreaSize) / 2,
    zIndex: 1,
  },
  overlayLeft: {
    width: (Dimensions.get('window').width - scanAreaSize) / 2,
    height: scanAreaSize,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayRight: {
    width: (Dimensions.get('window').width - scanAreaSize) / 2,
    height: scanAreaSize,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: (Dimensions.get('window').height - scanAreaSize) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    zIndex: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  galleryButtonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  galleryIcon: {
    width: 24,
    height: 20,
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  galleryIconInner: {
    width: 8,
    height: 6,
    backgroundColor: '#666666',
    borderRadius: 1,
  },
  galleryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  permissionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconText: {
    fontSize: 32,
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
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
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
});

export default StaffQRScannerModal;