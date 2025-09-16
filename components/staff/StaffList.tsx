// components/StaffList.tsx
import { Staff } from '@/types/staff';
import React from 'react';
import {
    FlatList,
    StyleSheet,
} from 'react-native';
import StaffCard from './StaffCard';
import StaffEmptyState from './StaffEmptyState';

interface StaffListProps {
    staffData: Staff[];
    hasSearchQuery: boolean;
    onStaffPress: (staff: Staff) => void;
    onAddPress: () => void;
}

const StaffList: React.FC<StaffListProps> = ({
    staffData,
    hasSearchQuery,
    onStaffPress,
    onAddPress,
}) => {
    return (
        <FlatList
            data={staffData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <StaffCard
                    staff={item}
                    onPress={() => onStaffPress(item)}
                />
            )}
            contentContainerStyle={styles.staffList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <StaffEmptyState
                    hasSearchQuery={hasSearchQuery}
                    onAddPress={onAddPress}
                />
            }
        />
    );
};

const styles = StyleSheet.create({
    staffList: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
});

export default StaffList;