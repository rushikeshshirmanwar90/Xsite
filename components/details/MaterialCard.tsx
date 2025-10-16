import { styles } from '@/style/details';
import { Material } from '@/types/details';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface MaterialCardProps {
    material: Material;
    animation: Animated.Value;
    activeTab: 'imported' | 'used';
    getAvailableQuantity: (material: Material) => number;
    getAvailabilityPercentage: (material: Material) => number;
    getImportedQuantity: (material: Material) => number;
    getQuantityWasted: (material: Material) => number;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
    material,
    animation,
    activeTab,
    getAvailableQuantity,
    getAvailabilityPercentage,
    getImportedQuantity,
    getQuantityWasted,
}) => {
    return (
        <Animated.View
            style={[
                styles.materialCard,
                {
                    opacity: animation,
                    transform: [
                        {
                            translateY: animation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [50, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <TouchableOpacity activeOpacity={0.95}>
                <View style={styles.materialHeader}>
                    <View style={styles.materialTitleSection}>
                        <View style={[styles.iconContainer, { backgroundColor: material.color + '20' }]}>
                            <Ionicons name={material.icon} size={24} color={material.color} />
                        </View>
                        <View style={styles.materialTitleInfo}>
                            <Text style={styles.materialNameText}>{material.name}</Text>
                            <View style={[styles.categoryTag, { backgroundColor: material.color }]}>
                                <Text style={styles.categoryText}>{material.category}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateText}>{material.date}</Text>
                        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                            <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.simpleProgressContainer}>
                    <View style={styles.progressBarWithLabels}>
                        <View style={styles.progressStartLabel}>
                            <Text style={styles.progressStartLabel}>
                                {activeTab === 'imported' ? 'Available:' : 'Quantity Used:'}
                            </Text>
                            <Text style={styles.progressStartLabel}>
                                {activeTab === 'imported'
                                    ? `${getAvailableQuantity(material)} ${material.unit}`
                                    : `${material.quantity} ${material.unit}`}
                            </Text>
                        </View>
                        <View style={styles.progressBarBackground}>
                            <View
                                style={[
                                    activeTab === 'imported' ? styles.progressBarFillGreen : styles.progressBarFillRed,
                                    {
                                        width: activeTab === 'imported'
                                            ? `${getAvailabilityPercentage(material)}%`
                                            : '100%',
                                    },
                                ]}
                            />
                        </View>
                        <View style={styles.progressEndLabel}>
                            <Text style={styles.progressEndLabel}>
                                {activeTab === 'imported' ? 'Total:' : 'Quantity Wasted:'}
                            </Text>
                            <Text style={styles.progressEndLabel}>
                                {activeTab === 'imported'
                                    ? `${getImportedQuantity(material)} ${material.unit}`
                                    : `${getQuantityWasted(material)} ${material.unit}`}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default MaterialCard;