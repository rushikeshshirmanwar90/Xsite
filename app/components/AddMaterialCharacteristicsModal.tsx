import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Material, MaterialCharacteristics } from '../types/materialTypes';

export interface AddMaterialCharacteristicsModalProps {
  visible: boolean;
  onClose: () => void;
  material: Material;
  onSave: (material: Material, characteristics: MaterialCharacteristics) => void;
}

const AddMaterialCharacteristicsModal: React.FC<AddMaterialCharacteristicsModalProps> = ({
  visible,
  onClose,
  material,
  onSave,
}) => {
  // State for characteristics type
  const [characteristicsType, setCharacteristicsType] = useState<string>(
    material.characteristics?.type || 'steel_rod'
  );

  // Steel rod characteristics
  const [steelSizes, setSteelSizes] = useState<string[]>(
    (material.characteristics?.type === 'steel_rod' ? 
      (material.characteristics.details as any).sizes : ['8mm'])
  );
  const [rodLength, setRodLength] = useState<string>(
    (material.characteristics?.type === 'steel_rod' ? 
      (material.characteristics.details as any).rodLength.toString() : '12')
  );

  // Brick characteristics
  const [brickQuantity, setBrickQuantity] = useState<string>(
    (material.characteristics?.type === 'brick' ? 
      (material.characteristics.details as any).brickQuantity.toString() : '1000')
  );

  // Electrical characteristics
  const [wireSqmm, setWireSqmm] = useState<string>(
    (material.characteristics?.type === 'electrical' ? 
      (material.characteristics.details as any).wireSqmm.toString() : '2.5')
  );
  const [wireMeters, setWireMeters] = useState<string>(
    (material.characteristics?.type === 'electrical' ? 
      (material.characteristics.details as any).wireMeters.toString() : '100')
  );
  const [hasPipes, setHasPipes] = useState<boolean>(
    (material.characteristics?.type === 'electrical' ? 
      (material.characteristics.details as any).hasPipes : false)
  );

  // Plumbing characteristics
  const [pipeType, setPipeType] = useState<string>(
    (material.characteristics?.type === 'plumbing' ? 
      (material.characteristics.details as any).pipeType : 'PVC')
  );
  const [pipeDiameter, setPipeDiameter] = useState<string>(
    (material.characteristics?.type === 'plumbing' ? 
      (material.characteristics.details as any).pipeDiameter.toString() : '25')
  );
  const [pipeLength, setPipeLength] = useState<string>(
    (material.characteristics?.type === 'plumbing' ? 
      (material.characteristics.details as any).pipeLength.toString() : '100')
  );

  // Granite characteristics
  const [graniteColor, setGraniteColor] = useState<string>(
    (material.characteristics?.type === 'granite' ? 
      (material.characteristics.details as any).color : 'Black')
  );
  const [graniteThickness, setGraniteThickness] = useState<string>(
    (material.characteristics?.type === 'granite' ? 
      (material.characteristics.details as any).thickness.toString() : '20')
  );
  const [graniteArea, setGraniteArea] = useState<string>(
    (material.characteristics?.type === 'granite' ? 
      (material.characteristics.details as any).area.toString() : '50')
  );

  // Wall putty characteristics
  const [puttyBrand, setPuttyBrand] = useState<string>(
    (material.characteristics?.type === 'wall_putty' ? 
      (material.characteristics.details as any).brand : 'Birla')
  );
  const [puttyCoverage, setPuttyCoverage] = useState<string>(
    (material.characteristics?.type === 'wall_putty' ? 
      (material.characteristics.details as any).coverage.toString() : '200')
  );
  const [puttyCoats, setPuttyCoats] = useState<string>(
    (material.characteristics?.type === 'wall_putty' ? 
      (material.characteristics.details as any).coats.toString() : '2')
  );

  const handleSave = () => {
    let characteristics: MaterialCharacteristics | undefined;

    switch (characteristicsType) {
      case 'steel_rod':
        characteristics = {
          type: 'steel_rod',
          details: {
            sizes: steelSizes,
            rodLength: parseFloat(rodLength)
          }
        };
        break;
      case 'brick':
        characteristics = {
          type: 'brick',
          details: {
            brickQuantity: parseInt(brickQuantity)
          }
        };
        break;
      case 'electrical':
        characteristics = {
          type: 'electrical',
          details: {
            wireSqmm: parseFloat(wireSqmm),
            wireMeters: parseInt(wireMeters),
            hasPipes
          }
        };
        break;
      case 'plumbing':
        characteristics = {
          type: 'plumbing',
          details: {
            pipeType,
            pipeDiameter: parseFloat(pipeDiameter),
            pipeLength: parseFloat(pipeLength)
          }
        };
        break;
      case 'granite':
        characteristics = {
          type: 'granite',
          details: {
            color: graniteColor,
            thickness: parseFloat(graniteThickness),
            area: parseFloat(graniteArea)
          }
        };
        break;
      case 'wall_putty':
        characteristics = {
          type: 'wall_putty',
          details: {
            brand: puttyBrand,
            coverage: parseFloat(puttyCoverage),
            coats: parseInt(puttyCoats)
          }
        };
        break;
      default:
        characteristics = undefined;
    }

    const updatedMaterial = {
      ...material,
      characteristics
    };

    onSave(updatedMaterial, characteristics!);
  };

  const toggleSteelSize = (size: string) => {
    if (steelSizes.includes(size)) {
      setSteelSizes(steelSizes.filter(s => s !== size));
    } else {
      setSteelSizes([...steelSizes, size]);
    }
  };

  const renderCharacteristicsForm = () => {
    switch (characteristicsType) {
      case 'steel_rod':
        return (
          <View>
            <Text style={styles.formLabel}>Steel Rod Sizes</Text>
            <View style={styles.checkboxContainer}>
              {['6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm', '32mm'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.checkbox, steelSizes.includes(size) && styles.checkboxSelected]}
                  onPress={() => toggleSteelSize(size)}
                >
                  <Text
                    style={[styles.checkboxText, steelSizes.includes(size) && styles.checkboxTextSelected]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Rod Length (meters)</Text>
            <TextInput
              style={styles.textInput}
              value={rodLength}
              onChangeText={setRodLength}
              keyboardType="numeric"
              placeholder="Enter rod length in meters"
            />
          </View>
        );

      case 'brick':
        return (
          <View>
            <Text style={styles.formLabel}>Brick Quantity</Text>
            <TextInput
              style={styles.textInput}
              value={brickQuantity}
              onChangeText={setBrickQuantity}
              keyboardType="numeric"
              placeholder="Enter brick quantity"
            />
          </View>
        );

      case 'electrical':
        return (
          <View>
            <Text style={styles.formLabel}>Wire Size (sq mm)</Text>
            <TextInput
              style={styles.textInput}
              value={wireSqmm}
              onChangeText={setWireSqmm}
              keyboardType="numeric"
              placeholder="Enter wire size in sq mm"
            />

            <Text style={styles.formLabel}>Wire Length (meters)</Text>
            <TextInput
              style={styles.textInput}
              value={wireMeters}
              onChangeText={setWireMeters}
              keyboardType="numeric"
              placeholder="Enter wire length in meters"
            />

            <View style={styles.switchContainer}>
              <Text style={styles.formLabel}>Has Conduit Pipes</Text>
              <Switch
                value={hasPipes}
                onValueChange={setHasPipes}
                trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
                thumbColor={hasPipes ? '#0EA5E9' : '#f4f3f4'}
              />
            </View>
          </View>
        );

      case 'plumbing':
        return (
          <View>
            <Text style={styles.formLabel}>Pipe Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pipeType}
                onValueChange={(itemValue) => setPipeType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="PVC" value="PVC" />
                <Picker.Item label="CPVC" value="CPVC" />
                <Picker.Item label="GI" value="GI" />
                <Picker.Item label="UPVC" value="UPVC" />
              </Picker>
            </View>

            <Text style={styles.formLabel}>Pipe Diameter (mm)</Text>
            <TextInput
              style={styles.textInput}
              value={pipeDiameter}
              onChangeText={setPipeDiameter}
              keyboardType="numeric"
              placeholder="Enter pipe diameter in mm"
            />

            <Text style={styles.formLabel}>Pipe Length (meters)</Text>
            <TextInput
              style={styles.textInput}
              value={pipeLength}
              onChangeText={setPipeLength}
              keyboardType="numeric"
              placeholder="Enter pipe length in meters"
            />
          </View>
        );

      case 'granite':
        return (
          <View>
            <Text style={styles.formLabel}>Granite Color</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={graniteColor}
                onValueChange={(itemValue) => setGraniteColor(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Black" value="Black" />
                <Picker.Item label="White" value="White" />
                <Picker.Item label="Grey" value="Grey" />
                <Picker.Item label="Brown" value="Brown" />
                <Picker.Item label="Green" value="Green" />
              </Picker>
            </View>

            <Text style={styles.formLabel}>Thickness (mm)</Text>
            <TextInput
              style={styles.textInput}
              value={graniteThickness}
              onChangeText={setGraniteThickness}
              keyboardType="numeric"
              placeholder="Enter thickness in mm"
            />

            <Text style={styles.formLabel}>Area (sq meters)</Text>
            <TextInput
              style={styles.textInput}
              value={graniteArea}
              onChangeText={setGraniteArea}
              keyboardType="numeric"
              placeholder="Enter area in sq meters"
            />
          </View>
        );

      case 'wall_putty':
        return (
          <View>
            <Text style={styles.formLabel}>Brand</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={puttyBrand}
                onValueChange={(itemValue) => setPuttyBrand(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Birla" value="Birla" />
                <Picker.Item label="JK" value="JK" />
                <Picker.Item label="Asian Paints" value="Asian Paints" />
                <Picker.Item label="Berger" value="Berger" />
              </Picker>
            </View>

            <Text style={styles.formLabel}>Coverage Area (sq meters)</Text>
            <TextInput
              style={styles.textInput}
              value={puttyCoverage}
              onChangeText={setPuttyCoverage}
              keyboardType="numeric"
              placeholder="Enter coverage area in sq meters"
            />

            <Text style={styles.formLabel}>Number of Coats</Text>
            <TextInput
              style={styles.textInput}
              value={puttyCoats}
              onChangeText={setPuttyCoats}
              keyboardType="numeric"
              placeholder="Enter number of coats"
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.characteristicsModalOverlay}>
        <View style={styles.characteristicsModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Material Characteristics</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.formLabel}>Characteristics Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={characteristicsType}
                onValueChange={(itemValue) => setCharacteristicsType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Steel Rod" value="steel_rod" />
                <Picker.Item label="Brick" value="brick" />
                <Picker.Item label="Electrical" value="electrical" />
                <Picker.Item label="Plumbing" value="plumbing" />
                <Picker.Item label="Granite" value="granite" />
                <Picker.Item label="Wall Putty" value="wall_putty" />
              </Picker>
            </View>

            {renderCharacteristicsForm()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  characteristicsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  characteristicsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  picker: {
    height: 50,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  checkbox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  checkboxSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0EA5E9',
  },
  checkboxText: {
    fontSize: 14,
    color: '#64748B',
  },
  checkboxTextSelected: {
    color: '#0369A1',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddMaterialCharacteristicsModal;