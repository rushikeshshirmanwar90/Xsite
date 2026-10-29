import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import type { ReportStage, SavedReport } from '@/services/costReportPdf';

// One sheet for the whole report flow: an animated "writing the page" state
// while the server builds the PDF, then the saved file with View and Share,
// or what went wrong with Try Again. Replaces the phone's plain alert.

export type ReportSheetPhase = 'working' | 'ready' | 'error';

interface Props {
  visible: boolean;
  phase: ReportSheetPhase;
  stage: ReportStage;
  /** "Materials" */
  categoryLabel: string;
  projectName: string;
  /** "28 items" */
  itemSummary: string;
  report: SavedReport | null;
  errorMessage: string | null;
  /** A View/Share failure, shown under the buttons. */
  actionError: string | null;
  onCancel: () => void;
  onClose: () => void;
  onView: () => void;
  onShare: () => void;
  onRetry: () => void;
}

const STAGE_TEXT: Record<ReportStage, string> = {
  collecting: 'Collecting the project data…',
  building: 'Building your PDF on the server…',
  downloading: 'Downloading the PDF…',
  saving: 'Saving it to this phone…',
};

const LARGE_TEXT_SCALE = 1.3;
const ART = 104;

const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// ─── Working art: a page whose lines write themselves in, with a soft pulse ──

const LINE_WIDTHS = [30, 38, 24, 34, 28];

const PageLine: React.FC<{ index: number; t: SharedValue<number>; still: boolean }> = ({ index, t, still }) => {
  const start = index * 0.13;
  const style = useAnimatedStyle(() => {
    if (still) return { transform: [{ scaleX: 1 }], opacity: 1 };
    const grow = interpolate(t.value, [start, start + 0.22], [0, 1], 'clamp');
    const fade = interpolate(t.value, [0.86, 1], [1, 0], 'clamp');
    return { transform: [{ scaleX: grow }], opacity: fade };
  });
  return (
    <Animated.View
      style={[
        art.line,
        { width: LINE_WIDTHS[index], backgroundColor: index === 0 ? Colors.primary : '#9CC2E6' },
        style,
      ]}
    />
  );
};

const WorkingArt: React.FC<{ still: boolean }> = ({ still }) => {
  const t = useSharedValue(0);
  const pulse = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    t.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    bob.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [still, t, pulse, bob]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: still ? 0 : interpolate(pulse.value, [0, 1], [0.45, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.4]) }],
  }));
  const pageStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View style={art.wrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={[art.ring, ringStyle]} />
      <View style={[art.circle, { backgroundColor: Colors.primaryLight }]}>
        <Animated.View style={[art.page, pageStyle]}>
          <View style={art.fold} />
          {LINE_WIDTHS.map((_, i) => (
            <PageLine key={i} index={i} t={t} still={still} />
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const ResultArt: React.FC<{ ok: boolean; still: boolean }> = ({ ok, still }) => {
  const burst = useSharedValue(0);
  useEffect(() => {
    if (!still && ok) burst.value = withDelay(80, withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }));
  }, [ok, still, burst]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burst.value, [0, 0.1, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(burst.value, [0, 1], [0.9, 1.5]) }],
  }));
  return (
    <View style={art.wrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={[art.ring, { borderColor: Colors.success }, ringStyle]} />
      <Animated.View
        entering={still ? undefined : ZoomIn.springify().damping(12).stiffness(180)}
        style={[art.circle, { backgroundColor: ok ? Colors.successLight : Colors.errorLight }]}
      >
        <View style={[art.badge, { backgroundColor: ok ? Colors.successText : Colors.errorText }]}>
          <Ionicons name={ok ? 'checkmark' : 'alert'} size={34} color="#FFFFFF" />
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Indeterminate progress bar ─────────────────────────────────────────────

const ProgressBar: React.FC<{ still: boolean }> = ({ still }) => {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (still || !width) return;
    x.value = 0;
    x.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.cubic) }), -1, false);
  }, [still, width, x]);
  const seg = width * 0.38;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: still ? width * 0.31 : interpolate(x.value, [0, 1], [-seg, width]) }],
  }));
  return (
    <View
      style={bar.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityLabel="Creating report"
      accessibilityState={{ busy: true }}
    >
      {width > 0 && <Animated.View style={[bar.fill, { width: seg }, style]} />}
    </View>
  );
};

// ─── Buttons ────────────────────────────────────────────────────────────────

const Button: React.FC<{
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  kind: 'primary' | 'tinted' | 'plain';
  onPress: () => void;
  grow?: boolean;
}> = ({ label, icon, kind, onPress, grow }) => {
  const fg = kind === 'primary' ? '#FFFFFF' : kind === 'tinted' ? Colors.primaryDark : Colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        btn.base,
        kind === 'primary' && btn.primary,
        kind === 'tinted' && btn.tinted,
        kind === 'plain' && btn.plain,
        grow && { flex: 1 },
        pressed && (kind === 'primary' ? btn.primaryPressed : kind === 'tinted' ? btn.tintedPressed : btn.plainPressed),
      ]}
    >
      {icon && <Ionicons name={icon} size={19} color={fg} />}
      <Text style={[btn.label, { color: fg }, kind === 'plain' && btn.plainLabel]}>{label}</Text>
    </Pressable>
  );
};

// ─── Sheet ──────────────────────────────────────────────────────────────────

const ReportSheet: React.FC<Props> = ({
  visible, phase, stage, categoryLabel, projectName, itemSummary, report, errorMessage, actionError,
  onCancel, onClose, onView, onShare, onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale >= LARGE_TEXT_SCALE;
  const still = useReducedMotion();

  // Haptic and spoken cue when the result arrives
  useEffect(() => {
    if (!visible) return;
    if (phase === 'ready') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      AccessibilityInfo.announceForAccessibility('Report ready');
    } else if (phase === 'error') {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      AccessibilityInfo.announceForAccessibility(`Couldn't create the report. ${errorMessage ?? ''}`);
    }
  }, [visible, phase, errorMessage]);

  const dismiss = phase === 'working' ? onCancel : onClose;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={dismiss}>
      <View style={sheet.root}>
        {/* Tapping outside closes a finished sheet, but never cancels a report in progress */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={phase === 'working' ? undefined : onClose}
          accessible={false}
        />
        <Animated.View
          entering={still ? undefined : FadeIn.duration(180)}
          style={[sheet.card, { marginBottom: Math.max(insets.bottom, 12) + 4 }]}
          accessibilityViewIsModal
        >
          <Animated.View key={phase} entering={still ? undefined : FadeIn.duration(220)} style={sheet.content}>
            {phase === 'working' ? (
              <>
                <WorkingArt still={still} />
                <Text style={sheet.title} accessibilityRole="header">Creating your report</Text>
                <Text style={sheet.subtitle}>
                  {categoryLabel} · {projectName}
                  {itemSummary ? ` · ${itemSummary}` : ''}
                </Text>
                <View style={sheet.progress}>
                  <ProgressBar still={still} />
                  <Animated.Text
                    key={stage}
                    entering={still ? undefined : FadeIn.duration(200)}
                    style={sheet.stage}
                    accessibilityLiveRegion="polite"
                  >
                    {STAGE_TEXT[stage]}
                  </Animated.Text>
                </View>
                <Button label="Cancel" kind="plain" onPress={onCancel} />
              </>
            ) : phase === 'ready' && report ? (
              <>
                <ResultArt ok still={still} />
                <Text style={sheet.title} accessibilityRole="header">Report ready</Text>
                <Text style={sheet.subtitle}>Saved on this phone. Open it now or send it to someone.</Text>

                <View style={sheet.file} accessible accessibilityLabel={`${report.fileName}, ${fmtSize(report.sizeBytes)} PDF`}>
                  <View style={sheet.fileTile}>
                    <Ionicons name="document-text" size={22} color={Colors.errorText} />
                    <Text style={sheet.fileTileText}>PDF</Text>
                  </View>
                  <View style={sheet.fileText}>
                    <Text style={sheet.fileName} numberOfLines={2}>{report.fileName}</Text>
                    <Text style={sheet.fileMeta}>{fmtSize(report.sizeBytes)} · {categoryLabel}</Text>
                  </View>
                </View>

                <View style={[sheet.actions, largeText && sheet.actionsStacked]}>
                  <Button label="View PDF" icon="eye-outline" kind="primary" onPress={onView} grow={!largeText} />
                  <Button label="Share PDF" icon="share-outline" kind="tinted" onPress={onShare} grow={!largeText} />
                </View>
                {actionError ? (
                  <Text style={sheet.actionError} accessibilityLiveRegion="polite">{actionError}</Text>
                ) : null}
                <Button label="Done" kind="plain" onPress={onClose} />
              </>
            ) : (
              <>
                <ResultArt ok={false} still={still} />
                <Text style={sheet.title} accessibilityRole="header">Couldn&apos;t create the report</Text>
                <Text style={sheet.subtitle}>{errorMessage ?? 'Something went wrong. Try again.'}</Text>
                <View style={sheet.actions}>
                  <Button label="Try Again" icon="refresh" kind="primary" onPress={onRetry} grow />
                </View>
                <Button label="Close" kind="plain" onPress={onClose} />
              </>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ReportSheet;

// ─── Styles ─────────────────────────────────────────────────────────────────

const art = StyleSheet.create({
  wrap: { width: ART, height: ART, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  ring: {
    position: 'absolute',
    width: ART,
    height: ART,
    borderRadius: ART / 2,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  circle: { width: ART, height: ART, borderRadius: ART / 2, alignItems: 'center', justifyContent: 'center' },
  page: {
    width: 52,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    paddingTop: 14,
    paddingHorizontal: 8,
    gap: 6,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  fold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  line: { height: 4, borderRadius: 2, transformOrigin: 'left' },
  badge: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});

const bar = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.fill, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
});

const btn = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: { backgroundColor: Colors.primary },
  primaryPressed: { backgroundColor: Colors.primaryDark },
  tinted: { backgroundColor: Colors.primaryLight },
  tintedPressed: { backgroundColor: '#C7E1FB' },
  plain: { minHeight: 44, alignSelf: 'center', marginTop: 6 },
  plainPressed: { opacity: 0.55 },
  label: { fontSize: 16, fontWeight: '600' },
  plainLabel: { fontWeight: '500' },
});

const sheet = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)', paddingHorizontal: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  content: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 28, paddingBottom: 14 },
  title: { fontSize: 21, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 21, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  progress: { alignSelf: 'stretch', marginTop: 22, marginBottom: 4, gap: 12 },
  stage: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary, textAlign: 'center' },
  file: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileTile: {
    width: 46,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTileText: { fontSize: 10, fontWeight: '800', color: Colors.errorText, marginTop: 1, letterSpacing: 0.5 },
  fileText: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  fileMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  actions: { alignSelf: 'stretch', flexDirection: 'row', gap: 10, marginTop: 18 },
  actionsStacked: { flexDirection: 'column' },
  actionError: { fontSize: 14, color: Colors.errorText, textAlign: 'center', marginTop: 10 },
});
