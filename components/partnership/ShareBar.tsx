import { Colors } from '@/constants/theme';
import { PartnerSummary } from '@/functions/partnership';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Each partner's share of everything put in, as one bar. Purely visual: the
// names and percentages beside it carry the same information as text.

interface ShareBarProps {
    partners: PartnerSummary[];
    colorFor: (partnerId: string) => string;
    height?: number;
}

const ShareBar: React.FC<ShareBarProps> = ({ partners, colorFor, height = 10 }) => {
    const withShare = partners.filter((p) => p.sharePercent > 0);

    return (
        <View
            style={[styles.track, { height, borderRadius: height / 2 }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            {withShare.map((partner, index) => (
                <View
                    key={partner.partnerId}
                    style={{
                        flex: partner.sharePercent,
                        backgroundColor: colorFor(partner.partnerId),
                        // A sliver of track between slices keeps neighbours apart
                        marginLeft: index > 0 ? 2 : 0,
                    }}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: Colors.fill,
    },
});

export default ShareBar;
