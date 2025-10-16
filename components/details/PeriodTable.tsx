import { styles } from '@/style/details';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface PeriodFilterProps {
    selectedPeriod: string;
    onSelectPeriod: (period: string) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({ selectedPeriod, onSelectPeriod }) => {
    const periods = ['Today', '1 Week', '15 Days', '1 Month', '3 Months', '6 Months', 'Custom'];

    return (
        <View style={styles.periodSection}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.periodContainer}
            >
                {periods.map((period, index) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.periodButtonActive,
                            index === 0 && styles.firstPeriodButton,
                            index === periods.length - 1 && styles.lastPeriodButton,
                        ]}
                        onPress={() => onSelectPeriod(period)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.periodText,
                                selectedPeriod === period && styles.periodTextActive,
                            ]}
                        >
                            {period}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default PeriodFilter;