import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';

interface UsageFlagButtonProps {
  /** Called when the flag is tapped (after it activates/expands). */
  onPress: () => void;
  /** How long the flag stays expanded before auto-collapsing. Default 2000ms. */
  autoCollapseMs?: number;
  /** Disable interaction (e.g. when the section is completed). */
  disabled?: boolean;
  /** Vertical anchor as a fraction of screen height. Default 0.8 (bottom-right). */
  topRatio?: number;
  /** Fixed distance (px) from the bottom of the screen. When set, overrides topRatio. */
  bottom?: number;
}

// Fixed geometry — the flag keeps a constant width and slides off the right edge when
// collapsed, leaving only TAB_VISIBLE px (the arrow tab) on screen. Sliding via translateX
// runs on the native thread, so the animation stays smooth (animating `width` would not).
const FLAG_WIDTH = 180;
const TAB_VISIBLE = 50;
const HIDDEN_OFFSET = FLAG_WIDTH - TAB_VISIBLE;

/**
 * A small "flag" that peeks from the right edge of the screen.
 *  - Mounts expanded (arrow + "Add Usage" label + icon) for `autoCollapseMs`, then
 *    auto-collapses to a small flag tab.
 *  - Tapping the collapsed flag re-activates it (expands) — it does NOT open the form.
 *  - Tapping while expanded fires `onPress` (opens the usage form).
 */
const UsageFlagButton: React.FC<UsageFlagButtonProps> = ({
  onPress,
  autoCollapseMs = 2000,
  disabled = false,
  topRatio = 0.8,
  bottom,
}) => {
  const [expanded, setExpanded] = useState(true);
  // 1 = expanded, 0 = collapsed flag
  const anim = useRef(new Animated.Value(1)).current;
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateTo = (to: number) => {
    Animated.timing(anim, {
      toValue: to,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true, // only transform + opacity are animated → smooth on UI thread
    }).start();
  };

  const scheduleCollapse = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setExpanded(false);
      animateTo(0);
    }, autoCollapseMs);
  };

  useEffect(() => {
    // Start expanded, then auto-collapse after the delay.
    scheduleCollapse();
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    if (disabled) return;
    if (!expanded) {
      // Inactive/collapsed → just activate (expand) and restart the auto-collapse timer.
      // The form is NOT opened on this tap.
      setExpanded(true);
      animateTo(1);
      scheduleCollapse();
      return;
    }
    // Already active/expanded → open the material usage form.
    onPress();
  };

  // Collapsed (anim=0) → slid right by HIDDEN_OFFSET; expanded (anim=1) → in place.
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [HIDDEN_OFFSET, 0] });
  // Fade the label + icon out a bit ahead of the slide so the collapse reads cleanly.
  const contentOpacity = anim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        bottom != null ? { bottom } : { top: `${topRatio * 100}%` as const },
        {
          opacity: disabled ? 0.55 : 1,
          transform: [{ translateX }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touch}
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={disabled}
      >
        {/* Directional arrow — the part that stays visible as the collapsed tab */}
        <Ionicons
          name={expanded ? 'chevron-forward' : 'chevron-back'}
          size={18}
          color="#B45309"
        />
        <Animated.Text numberOfLines={1} style={[styles.label, { opacity: contentOpacity }]}>
          Add Usage
        </Animated.Text>
        {/* Solid amber button keeps the "Material Used" identity */}
        <Animated.View style={[styles.iconBtn, { opacity: contentOpacity }]}>
          <Ionicons name="construct" size={18} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    width: FLAG_WIDTH,
    height: 64,
    // Faded amber flag body
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#FDE68A',
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 999,
  },
  touch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    gap: 7,
  },
  label: {
    flex: 1,
    color: '#B45309',
    fontWeight: '700',
    fontSize: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // Solid amber — the actual "button"
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UsageFlagButton;
