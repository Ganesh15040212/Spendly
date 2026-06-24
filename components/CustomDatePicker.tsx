import React from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface CustomDatePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime' | 'countdown';
  display?: 'default' | 'spinner' | 'calendar' | 'clock';
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  mode = 'date',
  display = 'default',
  onChange,
}) => {
  if (Platform.OS !== 'web') {
    return (
      <DateTimePicker
        value={value}
        mode={mode as any}
        display={display as any}
        onChange={onChange}
      />
    );
  }

  // Web Fallback: Render a nice HTML5 date input inside a simple card modal
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const handleWebChange = (e: any) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      const selectedDate = new Date(y, m - 1, d);
      // Simulate DateTimePickerEvent
      onChange({ type: 'set', nativeEvent: {} as any }, selectedDate);
    }
  };

  const handleDismiss = () => {
    onChange({ type: 'dismissed', nativeEvent: {} as any }, undefined);
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.webOverlay}>
        <View style={styles.webModal}>
          <View style={styles.webHeader}>
            <Text style={styles.webTitle}>Select Date</Text>
            <TouchableOpacity onPress={handleDismiss}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <input
            type="date"
            value={dateString}
            onChange={handleWebChange}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '16px',
              fontFamily: 'inherit',
              marginTop: '10px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <TouchableOpacity style={styles.webConfirmBtn} onPress={handleDismiss}>
            <Text style={styles.webConfirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: 290,
    // Native-like shadow for web browser
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      } as any,
    }),
  },
  webHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  webTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  webConfirmBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  webConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CustomDatePicker;
