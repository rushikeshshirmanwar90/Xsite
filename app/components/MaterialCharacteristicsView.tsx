import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCharacteristics } from '../types/materialTypes';

interface MaterialCharacteristicsViewProps {
  characteristics: MaterialCharacteristics;
}

const MaterialCharacteristicsView: React.FC<MaterialCharacteristicsViewProps> = ({ characteristics }) => {
  const renderSteelRodCharacteristics = () => {
    const details = characteristics.details as any;
    return (
      <>
        <Text style={styles.characteristicsLabel}>Rod Sizes:</Text>
        <View style={styles.sizesContainer}>
          {details.sizes.map((size: string, index: number) => (
            <View key={index} style={styles.sizeTag}>
              <Text style={styles.sizeTagText}>{size}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.characteristicsLabel}>Rod Length:</Text>
        <Text style={styles.characteristicsDetail}>{details.rodLength} meters</Text>
      </>
    );
  };

  const renderBrickCharacteristics = () => {
    const details = characteristics.details as any;
    return (
      <>
        <Text style={styles.characteristicsLabel}>Quantity:</Text>
        <Text style={styles.characteristicsDetail}>{details.brickQuantity} pieces</Text>
      </>
    );
  };

  const renderElectricalCharacteristics = () => {
    const details = characteristics.details as any;
    return (
      <>
        <Text style={styles.characteristicsLabel}>Wire Size:</Text>
        <Text style={styles.characteristicsDetail}>{details.wireSqmm} sq mm</Text>
        <Text style={styles.characteristicsLabel}>Wire Length:</Text>
        <Text style={styles.characteristicsDetail}>{details.wireMeters} meters</Text>
        <Text style={styles.characteristicsLabel}>Conduit Pipes:</Text>
        <Text style={styles.characteristicsDetail}>{details.hasPipes ? 'Yes' : 'No'}</Text>
      </>
    );
  };

  const renderPlumbingCharacteristics = () => {
    const details = characteristics.details as any;
    return (
      <>
        <Text style={styles.characteristicsLabel}>Pipe Type:</Text>
        <Text style={styles.characteristicsDetail}>{details.pipeType}</Text>
        <Text style={styles.characteristicsLabel}>Pipe Diameter:</Text>
        <Text style={styles.characteristicsDetail}>{details.pipeDiameter} mm</Text>
        <Text style={styles.characteristicsLabel}>Pipe Length:</Text>
        <Text style={styles.characteristicsDetail}>{details.pipeLength} meters</Text>
      </>
    );
  };

  const renderGraniteCharacteristics = () => {
    const details = characteristics.details as any;
    return (
      <>
        <Text style={styles.characteristicsLabel}>Color:</Text>
        <Text style={styles.characteristicsDetail}>{details.color}</Text>
        <Text style={styles.characteristicsLabel}>Thickness:</Text>
        <Text style={styles.characteristicsDetail}>{details.thickness} mm</Text>
        <Text style={styles.characteristicsLabel}>Area:</Text>
        <Text style={styles.characteristicsDetail}>{details.area} sq meters</Text>
      </>
    );
  };

  const renderWallPuttyCharacteristics = () => {
    const details = characteristics.details as any;
    return (
      <>
        <Text style={styles.characteristicsLabel}>Brand:</Text>
        <Text style={styles.characteristicsDetail}>{details.brand}</Text>
        <Text style={styles.characteristicsLabel}>Coverage Area:</Text>
        <Text style={styles.characteristicsDetail}>{details.coverage} sq meters</Text>
        <Text style={styles.characteristicsLabel}>Number of Coats:</Text>
        <Text style={styles.characteristicsDetail}>{details.coats}</Text>
      </>
    );
  };

  const renderCharacteristics = () => {
    switch (characteristics.type) {
      case 'steel_rod':
        return renderSteelRodCharacteristics();
      case 'brick':
        return renderBrickCharacteristics();
      case 'electrical':
        return renderElectricalCharacteristics();
      case 'plumbing':
        return renderPlumbingCharacteristics();
      case 'granite':
        return renderGraniteCharacteristics();
      case 'wall_putty':
        return renderWallPuttyCharacteristics();
      default:
        return null;
    }
  };

  return (
    <View style={styles.characteristicsContainer}>
      <Text style={styles.characteristicsTitle}>Material Specifications</Text>
      <View style={styles.characteristicsContent}>
        {renderCharacteristics()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  characteristicsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  characteristicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  characteristicsContent: {
    marginLeft: 4,
  },
  characteristicsLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginTop: 6,
    marginBottom: 2,
  },
  characteristicsDetail: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  sizeTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  sizeTagText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
  },
});

export default MaterialCharacteristicsView;