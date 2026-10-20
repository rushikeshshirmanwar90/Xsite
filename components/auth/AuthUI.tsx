import { Colors, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Shared building blocks for the log in and staff registration screens.

// Forms keep a comfortable reading width on tablets and in wide windows
export const AUTH_FORM_MAX_WIDTH = 440;
export const AUTH_GUTTER = 24;

// ─── Password rules ─────────────────────────────────────────────────────────
// Mirrors isStrongPassword in the API, which also rejects any character
// outside letters, numbers and @$!%*?&.

export const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
    { label: 'An uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
    { label: 'A lowercase letter', test: (value: string) => /[a-z]/.test(value) },
    { label: 'A number', test: (value: string) => /\d/.test(value) },
    { label: 'A symbol: @ $ ! % * ? &', test: (value: string) => /[@$!%*?&]/.test(value) },
];

const ALLOWED_PASSWORD_CHARACTERS = /^[A-Za-z\d@$!%*?&]*$/;

export const isPasswordValid = (value: string) =>
    ALLOWED_PASSWORD_CHARACTERS.test(value) && PASSWORD_RULES.every(rule => rule.test(value));

// Lets iOS suggest a strong password that the API will accept
export const IOS_PASSWORD_RULES =
    'minlength: 8; required: lower; required: upper; required: digit; required: [@$!%*?&]; allowed: [@$!%*?&];';

// ─── Feedback ───────────────────────────────────────────────────────────────
// Inline messages get a haptic and a screen reader announcement, so they
// reach people who aren't looking at the field.

export const signalError = (message: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    AccessibilityInfo.announceForAccessibility(message);
};

export const signalSuccess = (message?: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (message) AccessibilityInfo.announceForAccessibility(message);
};

// ─── Blueprint backdrop ─────────────────────────────────────────────────────
// Drafting-grid paper behind the top of the screen: the drawings site teams
// work from every day. Major lines line up with the form's leading edge.

const GRID = 16;
const GRID_HEIGHT = 320;

export const BlueprintBackdrop = () => {
    const { width } = useWindowDimensions();
    const originX = Math.max(AUTH_GUTTER, (width - AUTH_FORM_MAX_WIDTH) / 2);

    let minor = '';
    let major = '';
    for (let x = originX % GRID; x <= width; x += GRID) {
        const line = `M${x} 0V${GRID_HEIGHT}`;
        if (Math.round((x - originX) / GRID) % 4 === 0) major += line;
        else minor += line;
    }
    for (let y = GRID; y <= GRID_HEIGHT; y += GRID) {
        const line = `M0 ${y}H${width}`;
        if ((y / GRID) % 4 === 0) major += line;
        else minor += line;
    }

    return (
        <View
            style={styles.backdrop}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Svg width={width} height={GRID_HEIGHT}>
                <Path d={minor} stroke={Colors.primary} strokeOpacity={0.08} strokeWidth={0.5} />
                <Path d={major} stroke={Colors.primary} strokeOpacity={0.13} strokeWidth={1} />
            </Svg>
            <LinearGradient
                colors={[`${Colors.background}00`, Colors.background]}
                locations={[0.3, 1]}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );
};

// ─── Brand ──────────────────────────────────────────────────────────────────
// Same mark as the home screen header.

export const BrandMark = () => (
    <View style={styles.brandRow}>
        <View style={styles.brandTile} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.brandTileText} allowFontScaling={false}>EX</Text>
        </View>
        <Text style={styles.brandName}>Exponentor</Text>
    </View>
);

// ─── Headings ───────────────────────────────────────────────────────────────

export const AuthHeading = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {children ? <Text style={styles.body}>{children}</Text> : null}
    </View>
);

// Highlights a value, such as an email address, inside AuthHeading copy
export const AuthEmphasis = ({ children }: { children: React.ReactNode }) => (
    <Text style={styles.emphasis}>{children}</Text>
);

// ─── Buttons ────────────────────────────────────────────────────────────────
// filled: the one main action on a screen. tinted: a secondary step inside the
// form. plain: low-emphasis text actions, still 44pt tall.

type AuthButtonVariant = 'filled' | 'tinted' | 'plain';

interface AuthButtonProps {
    title: string;
    onPress: () => void;
    variant?: AuthButtonVariant;
    loading?: boolean;
    // Shown next to the spinner, e.g. "Logging in…"
    loadingTitle?: string;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

export const AuthButton = ({
    title,
    onPress,
    variant = 'filled',
    loading = false,
    loadingTitle,
    disabled = false,
    style,
    accessibilityLabel,
}: AuthButtonProps) => {
    const inactive = disabled || loading;
    const labelColor = variant === 'filled' ? '#FFFFFF' : Colors.primaryDark;
    const visibleTitle = loading && loadingTitle ? loadingTitle : title;

    return (
        <Pressable
            onPress={onPress}
            disabled={inactive}
            accessibilityRole="button"
            accessibilityLabel={loading ? visibleTitle : (accessibilityLabel ?? title)}
            accessibilityState={{ disabled: inactive, busy: loading }}
            style={({ pressed }) => [
                styles.button,
                variant === 'filled' && styles.buttonFilled,
                variant === 'tinted' && styles.buttonTinted,
                variant === 'plain' && styles.buttonPlain,
                pressed && (variant === 'filled' ? styles.buttonFilledPressed : styles.buttonDimmed),
                disabled && !loading && styles.buttonDisabled,
                style,
            ]}
        >
            {loading && <ActivityIndicator size="small" color={labelColor} />}
            <Text style={[styles.buttonText, variant === 'plain' && styles.buttonTextPlain, { color: labelColor }]}>
                {visibleTitle}
            </Text>
        </Pressable>
    );
};

// ─── Password checklist ─────────────────────────────────────────────────────
// Updates as people type. Unmet rules turn red only after a failed submit.

export const PasswordChecklist = ({ password, showErrors = false }: { password: string; showErrors?: boolean }) => {
    const hasDisallowedCharacters = !ALLOWED_PASSWORD_CHARACTERS.test(password);

    return (
        <View style={styles.checklist}>
            {PASSWORD_RULES.map(rule => {
                const met = rule.test(password);
                const failed = !met && showErrors;
                return (
                    <View
                        key={rule.label}
                        style={styles.ruleRow}
                        accessible
                        accessibilityLabel={`${rule.label}, ${met ? 'met' : 'not met yet'}`}
                    >
                        <Ionicons
                            name={met ? 'checkmark-circle' : failed ? 'close-circle' : 'ellipse-outline'}
                            size={18}
                            color={met ? Colors.successText : failed ? Colors.errorText : Colors.textSecondary}
                        />
                        <Text style={[styles.ruleText, failed && styles.ruleTextFailed]}>{rule.label}</Text>
                    </View>
                );
            })}
            {hasDisallowedCharacters && (
                <View style={styles.ruleRow} accessible>
                    <Ionicons name="close-circle" size={18} color={Colors.errorText} />
                    <Text style={[styles.ruleText, styles.ruleTextFailed]}>No spaces or other symbols</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: GRID_HEIGHT,
        pointerEvents: 'none',
    },

    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    brandTile: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandTileText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    brandName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },

    heading: {
        gap: 8,
        marginBottom: 8,
    },
    title: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.6,
    },
    body: {
        fontSize: 16,
        lineHeight: 23,
        color: Colors.textSecondary,
    },
    emphasis: {
        fontWeight: '600',
        color: Colors.textPrimary,
    },

    button: {
        minHeight: 54,
        borderRadius: Radius.md,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    buttonFilled: {
        backgroundColor: Colors.primary,
    },
    buttonFilledPressed: {
        backgroundColor: Colors.primaryDark,
    },
    buttonTinted: {
        backgroundColor: Colors.primaryLight,
    },
    buttonPlain: {
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    buttonDimmed: {
        opacity: 0.6,
    },
    buttonDisabled: {
        opacity: 0.45,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.2,
        textAlign: 'center',
    },
    buttonTextPlain: {
        fontSize: 16,
    },

    checklist: {
        gap: 8,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ruleText: {
        flexShrink: 1,
        fontSize: 14,
        lineHeight: 19,
        color: Colors.textSecondary,
    },
    ruleTextFailed: {
        color: Colors.errorText,
    },
});
