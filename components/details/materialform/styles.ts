import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';

type Styles = {
  [key: string]: ViewStyle | TextStyle | ImageStyle | any;
};

export const sharedStyles = StyleSheet.create<Styles>({
  formContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  formScrollContent: {
    padding: 20,
  },
  formHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  closeButton: {
    fontSize: 28,
    color: '#64748B',
    fontWeight: '300' as const,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  selectInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  selectInputText: {
    fontSize: 15,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#64748B',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1E293B',
  },
});
