import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

// This file contains common types used across components

export type MaterialIconName = ComponentProps<typeof Ionicons>['name'];

export type Period = 'Today' | '1 Week' | '15 Days' | '1 Month' | '3 Months' | '6 Months' | 'Custom';

export type MaterialTab = 'imported' | 'used';
