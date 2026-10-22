import { AuthButton } from '@/components/auth/AuthUI';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Bottom sheet used by every partnership form: a short title, the fields, and
// one primary action pinned above the home indicator.

interface PartnershipSheetProps {
    visible: boolean;
    title: string;
    subtitle?: string;
    onClose: () => void;
    primaryTitle: string;
    primaryLoadingTitle?: string;
    onPrimary: () => void;
    loading?: boolean;
    children: React.ReactNode;
}

const PartnershipSheet: React.FC<PartnershipSheetProps> = ({
    visible,
    title,
    subtitle,
    onClose,
    primaryTitle,
    primaryLoadingTitle,
    onPrimary,
    loading = false,
    children,
}) => {
    const insets = useSafeAreaInsets();
    // Don't let a stray tap throw away a request that's in flight
    const close = loading ? undefined : onClose;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={close}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.sheet}
                >
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text style={styles.title} accessibilityRole="header">{title}</Text>
                            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                        </View>
                        <Pressable
                            onPress={close}
                            disabled={loading}
                            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                        >
                            <Ionicons name="close" size={20} color={Colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.body}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {children}
                    </ScrollView>

                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        <AuthButton
                            title={primaryTitle}
                            loadingTitle={primaryLoadingTitle}
                            loading={loading}
                            onPress={onPrimary}
                        />
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    sheet: {
        maxHeight: '92%',
        backgroundColor: Colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    handle: {
        alignSelf: 'center',
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.border,
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerText: {
        flex: 1,
        paddingTop: 6,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.fill,
    },
    closeButtonPressed: {
        opacity: 0.6,
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
});

export default PartnershipSheet;
