import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  subMessage,
}) => {
  const { colors, spacing, sizes, t } = useTheme();

  const activeMessage = message || t.noTransactions;
  const activeSubMessage = subMessage || '';

  return (
    <View style={[styles.container, { padding: spacing.xl, backgroundColor: colors.cardGlow || 'rgba(0,0,0,0.01)' }]}>
      {/* Decorative Circles */}
      <View style={styles.graphicContainer}>
        <View style={[styles.circleOuter, { backgroundColor: colors.primaryLight, opacity: 0.3 }]} />
        <View style={[styles.circleMiddle, { backgroundColor: colors.primaryLight, opacity: 0.5 }]} />
        <View style={[styles.circleInner, { backgroundColor: colors.primary }]}>
          <Ionicons name="receipt-outline" size={32} color="#ffffff" />
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text, fontSize: sizes.h3 }]}>{activeMessage}</Text>
      {activeSubMessage ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {activeSubMessage}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0', // Light border
    // Align border style to match dark mode border
  },
  graphicContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  circleMiddle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  circleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
export default EmptyState;
