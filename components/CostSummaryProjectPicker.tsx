import { Colors } from '@/constants/theme';
import { Project } from '@/types/project';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CostSummaryProjectPickerProps {
    visible: boolean;
    projects: Project[];
    onClose: () => void;
    onSelect: (project: Project) => void;
}

// Search only shows once the list is long enough to need it
const SEARCH_THRESHOLD = 6;

/**
 * Bottom sheet opened from the home page's Cost Summary button.
 * Lists the projects already loaded on the home page; picking one hands it back
 * to the caller, which opens /cost-summary for that project.
 */
const CostSummaryProjectPicker: React.FC<CostSummaryProjectPickerProps> = ({
    visible,
    projects,
    onClose,
    onSelect,
}) => {
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');

    // Clear the search on the way out so the sheet always reopens on the full list
    const handleClose = () => {
        setQuery('');
        onClose();
    };

    const handleSelect = (project: Project) => {
        setQuery('');
        onSelect(project);
    };

    // Ongoing before completed, pinned first within each, then A–Z
    const sortedProjects = useMemo(
        () =>
            projects
                .filter(p => !!p._id)
                .sort((a, b) => {
                    if (!!a.isCompleted !== !!b.isCompleted) return a.isCompleted ? 1 : -1;
                    if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
                    return (a.name || '').localeCompare(b.name || '');
                }),
        [projects]
    );

    const search = query.trim().toLowerCase();
    const visibleProjects = search
        ? sortedProjects.filter(
              p =>
                  (p.name || '').toLowerCase().includes(search) ||
                  (p.address || '').toLowerCase().includes(search)
          )
        : sortedProjects;

    const showSearch = sortedProjects.length > SEARCH_THRESHOLD;

    const renderProject = ({ item }: { item: Project }) => (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => handleSelect(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}${item.isCompleted ? ', completed' : ''}. Open cost summary`}
        >
            <View style={styles.rowIcon}>
                <Ionicons name="business-outline" size={19} color={Colors.primary} />
            </View>
            <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                {!!item.address && (
                    <Text style={styles.rowAddress} numberOfLines={1}>{item.address}</Text>
                )}
            </View>
            {item.isCompleted && (
                <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Tapping the dimmed area closes the sheet */}
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close project list"
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.kbWrap}
                    pointerEvents="box-none"
                >
                    <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <View style={styles.grabber} />

                        <View style={styles.header}>
                            <View style={styles.headerTextBlock}>
                                <Text style={styles.headerTitle} accessibilityRole="header">Cost Summary</Text>
                                <Text style={styles.headerSubtitle}>Choose a project to see what has been spent</Text>
                            </View>
                            <Pressable
                                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                                onPress={handleClose}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Ionicons name="close" size={20} color={Colors.textSecondary} />
                            </Pressable>
                        </View>

                        {showSearch && (
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={17} color={Colors.textTertiary} />
                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder="Search by name or address"
                                    placeholderTextColor={Colors.textTertiary}
                                    style={styles.searchInput}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    returnKeyType="search"
                                    clearButtonMode="while-editing"
                                    accessibilityLabel="Search projects"
                                />
                            </View>
                        )}

                        <FlatList
                            data={visibleProjects}
                            keyExtractor={p => p._id as string}
                            renderItem={renderProject}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            keyboardShouldPersistTaps="handled"
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons
                                        name={search ? 'search-outline' : 'folder-open-outline'}
                                        size={28}
                                        color={Colors.textTertiary}
                                    />
                                    <Text style={styles.emptyTitle}>
                                        {search ? 'No matching projects' : 'No projects yet'}
                                    </Text>
                                    <Text style={styles.emptyBody}>
                                        {search
                                            ? 'Try a different name or address.'
                                            : 'Add a project first to see its cost summary.'}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default CostSummaryProjectPicker;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.45)',
        justifyContent: 'flex-end',
    },
    kbWrap: {
        maxHeight: '80%',
    },
    sheet: {
        // Shrinks to the 80% cap so a long project list scrolls instead of overflowing
        flexShrink: 1,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 16,
    },
    grabber: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 12,
    },
    headerTextBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonPressed: {
        backgroundColor: Colors.border,
    },

    // Search
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 12,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#0F172A',
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    },

    // List
    list: {
        flexGrow: 0,
        flexShrink: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    separator: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 52,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 60,
        paddingVertical: 10,
    },
    rowPressed: {
        opacity: 0.6,
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowText: {
        flex: 1,
    },
    rowName: {
        fontSize: 15.5,
        fontWeight: '700',
        color: '#0F172A',
    },
    rowAddress: {
        fontSize: 12.5,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    completedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: '#ECFDF5',
    },
    completedBadgeText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#047857',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 6,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 4,
    },
    emptyBody: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
