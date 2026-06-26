import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, ThemeMode } from '../utils/theme';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { setCachedCustomCategories, getMergedCategories } from '../utils/helpers';

// 6 Premium Avatar Icon configurations
const AVATARS = [
  { id: 'avatar1', icon: 'wallet-outline', color: '#6366f1', label: 'Finance Wiz' },
  { id: 'avatar2', icon: 'cash-outline', color: '#10b981', label: 'Cash Saver' },
  { id: 'avatar3', icon: 'gift-outline', color: '#f59e0b', label: 'Bonus Getter' },
  { id: 'avatar4', icon: 'person-outline', color: '#06b6d4', label: 'Tech Budgeter' },
  { id: 'avatar5', icon: 'ribbon-outline', color: '#8b5cf6', label: 'Goal Getter' },
  { id: 'avatar6', icon: 'trending-up-outline', color: '#f43f5e', label: 'Wealth Guru' },
];

const COLOR_PRESETS = [
  '#10b981', // Emerald Green
  '#f43f5e', // Rose Red
  '#f59e0b', // Amber Orange
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet/Purple
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

const ICON_PRESETS = [
  'barbell-outline',
  'heart-outline',
  'gift-outline',
  'game-controller-outline',
  'briefcase-outline',
  'book-outline',
  'car-outline',
  'home-outline',
  'cart-outline',
  'restaurant-outline',
  'medical-outline',
  'laptop-outline',
];

export const ProfileScreen: React.FC = () => {
  const {
    colors,
    spacing,
    sizes,
    shadows,
    themeMode,
    setThemeMode,
    currency,
    setCurrency,
    username,
    setUsername,
    profilePicture,
    setProfilePicture,
    t,
    language,
  } = useTheme();

  const router = useRouter();

  // User details local states
  const [userNameField, setUserNameField] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar1');

  // UI state
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Custom Category states
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#6366f1'); // Default Indigo
  const [catIcon, setCatIcon] = useState('options-outline'); // Default custom icon

  // Load initial settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const profile = await StorageService.getUserProfile();
        if (profile) {
          setUserNameField(profile.name);
          setUserEmail(profile.email);
          setUserPhone(profile.phone);
        }
        setSelectedAvatar(profilePicture);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [profilePicture, username]);

  const handleSaveChanges = async () => {
    if (!userNameField.trim()) return;
    setUpdating(true);

    try {
      // 1. Update local user profile details
      const currentProfile = await StorageService.getUserProfile();
      const updatedProfile = {
        id: currentProfile?.id || 'local_user_' + Date.now(),
        name: userNameField.trim(),
        email: userEmail,
        phone: userPhone,
        role: currentProfile?.role || 'user' as const,
      };
      await StorageService.setUserProfile(updatedProfile);
      
      // Update context and storage states
      await setUsername(userNameField.trim());
      await setProfilePicture(selectedAvatar);

      // Sync data to backend in background (if online)
      ApiService.syncData();

      Alert.alert(t.success, t.saved);
    } catch (e) {
      console.error(e);
      Alert.alert(t.error, 'Failed to update configurations.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    const performLogout = async () => {
      await StorageService.logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm(t.logoutDesc);
      if (confirmLogout) {
        performLogout();
      }
    } else {
      Alert.alert(
        t.logoutTitle,
        t.logoutDesc,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.confirm, style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t.deleteWarning, 'Media library access is required to choose a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const selectedUri = result.assets[0].uri;
        setSelectedAvatar(selectedUri);
        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(t.error, 'Failed to pick image from gallery.');
    }
  };

  const handleSaveCategory = async () => {
    const trimmedName = catName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category name is unique
    const mergedCats = getMergedCategories(catType);
    const exists = Object.keys(mergedCats).some(
      key => key.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      Alert.alert('Error', `A category named "${trimmedName}" already exists for ${catType}s.`);
      return;
    }

    const newCategory = {
      name: trimmedName,
      icon: catIcon,
      color: catColor,
    };

    try {
      await StorageService.addCustomCategory(catType, newCategory);

      // Update in-memory cache immediately
      const customCats = await StorageService.getCustomCategories();
      setCachedCustomCategories(customCats.income, customCats.expense);

      Alert.alert('Success', `Category "${trimmedName}" has been successfully added to your ${catType} list.`);
      
      // Reset form
      setCatName('');
      setCatIcon('options-outline');
      setCatColor('#6366f1');
    } catch (e) {
      console.error('Failed to save category', e);
      Alert.alert('Error', 'An error occurred while saving the custom category.');
    }
  };

  const isCustomPhoto = selectedAvatar.startsWith('file://') || selectedAvatar.startsWith('content://') || selectedAvatar.startsWith('ph://') || selectedAvatar.startsWith('http');
  const activeAvatar = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#f8fafc' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: sizes.h2 }]}>
          {t.profileTitle}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* User Card with Avatar and Name Change */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, marginHorizontal: spacing.md }, shadows]}>
          {/* Avatar circle */}
          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: activeAvatar.color + '20' }]}
            onPress={() => setShowAvatarModal(true)}
          >
            {isCustomPhoto ? (
              <Image source={{ uri: selectedAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name={activeAvatar.icon as any} size={48} color={activeAvatar.color} />
            )}
            <View style={[styles.editAvatarIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.fieldsContainer}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.editName}</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputField, { color: colors.text }]}
                placeholder={t.enterName}
                placeholderTextColor={colors.textSecondary + '70'}
                value={userNameField}
                onChangeText={setUserNameField}
              />
            </View>

            <View style={styles.readOnlyRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>{userEmail}</Text>
            </View>
            {userPhone ? (
              <View style={styles.readOnlyRow}>
                <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.readOnlyText, { color: colors.textSecondary }]}>{userPhone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Preferences Header */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginHorizontal: spacing.md, marginTop: spacing.lg }]}>
          {t.preferences}
        </Text>

        <View style={[styles.preferencesContainer, { backgroundColor: colors.card, marginHorizontal: spacing.md }, shadows]}>
          {/* 1. Theme Selection Row */}
          <View style={[styles.preferenceRow, { borderBottomColor: colors.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={[styles.prefLabelBox, { marginBottom: 12 }]}>
              <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t.themeMode}</Text>
            </View>
            <View style={styles.themeSelectorGroup}>
              {([
                { code: 'light', label: t.themeLight },
                { code: 'dark', label: t.themeDark }
              ] as { code: ThemeMode; label: string }[]).map(themeItem => {
                const isActive = themeMode === themeItem.code;
                const btnColor = colors.primary;

                return (
                  <TouchableOpacity
                    key={themeItem.code}
                    style={[
                      styles.selectorBtn,
                      { borderColor: colors.border },
                      isActive && { backgroundColor: btnColor, borderColor: btnColor },
                    ]}
                    onPress={() => setThemeMode(themeItem.code)}
                  >
                    <Text style={[styles.selectorBtnText, { color: isActive ? '#ffffff' : colors.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>
                      {themeItem.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Currency Selection Row */}
          <View style={[styles.preferenceRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0 }]}>
            <View style={[styles.prefLabelBox, { marginBottom: 12 }]}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
              <Text style={[styles.prefLabel, { color: colors.text }]}>{t.currency}</Text>
            </View>
            <View style={styles.currencySelectorGroup}>
              {[
                { symbol: '₹', label: '₹ Rupee' },
                { symbol: '$', label: '$ Dollar' },
                { symbol: '€', label: '€ Euro' },
                { symbol: '£', label: '£ Pound' },
                { symbol: '¥', label: '¥ Yen' },
              ].map(({ symbol, label }) => {
                const isActive = currency === symbol;
                return (
                  <TouchableOpacity
                    key={symbol}
                    style={[
                      styles.currencyBtn,
                      { borderColor: colors.border, backgroundColor: colors.background },
                      isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setCurrency(symbol)}
                  >
                    <Text style={[styles.currencyBtnText, { color: isActive ? '#ffffff' : colors.text }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Custom Categories Header */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginHorizontal: spacing.md, marginTop: spacing.lg }]}>
          {language === 'ta' ? 'தனிப்பயன் வகைகள்' : language === 'hi' ? 'कस्टम श्रेणियां' : language === 'es' ? 'Categorías Personalizadas' : 'Custom Categories'}
        </Text>

        <View style={[styles.preferencesContainer, { backgroundColor: colors.card, marginHorizontal: spacing.md, padding: 16 }, shadows]}>
          <Text style={[styles.prefLabel, { color: colors.text, marginBottom: 12 }]}>
            {language === 'ta' ? 'புதிய வகையைச் சேர்க்கவும்' : language === 'hi' ? 'नई श्रेणी जोड़ें' : language === 'es' ? 'Agregar Nueva Categoría' : 'Add New Category'}
          </Text>

          {/* Category Name Input */}
          <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              placeholder={language === 'ta' ? 'வகை பெயர் (எ.கா. ஜிம்)' : language === 'hi' ? 'श्रेणी का नाम (जैसे जिम)' : language === 'es' ? 'Nombre (ej. Gimnasio)' : 'Category Name (e.g. Gym)'}
              placeholderTextColor={colors.textSecondary + '70'}
              value={catName}
              onChangeText={setCatName}
            />
          </View>

          {/* Category Type selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
              {language === 'ta' ? 'வகை வகை' : language === 'hi' ? 'श्रेणी का प्रकार' : language === 'es' ? 'Tipo de Categoría' : 'Category Type'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.selectorBtn,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  catType === 'expense' && { backgroundColor: colors.expense, borderColor: colors.expense },
                ]}
                onPress={() => setCatType('expense')}
              >
                <Text style={{ color: catType === 'expense' ? '#ffffff' : colors.text, fontWeight: 'bold' }}>
                  {t.expense}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorBtn,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  catType === 'income' && { backgroundColor: colors.income, borderColor: colors.income },
                ]}
                onPress={() => setCatType('income')}
              >
                <Text style={{ color: catType === 'income' ? '#ffffff' : colors.text, fontWeight: 'bold' }}>
                  {t.income}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preset Colors selector */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
              {language === 'ta' ? 'வண்ணத்தைத் தேர்வுசெய்க' : language === 'hi' ? 'रंग चुनें' : language === 'es' ? 'Seleccionar Color' : 'Select Color'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {COLOR_PRESETS.map(color => {
                const isSelected = catColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: colors.text,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => setCatColor(color)}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Preset Icons selector */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
              {language === 'ta' ? 'சின்னத்தைத் தேர்வுசெய்க' : language === 'hi' ? 'आइकन चुनें' : language === 'es' ? 'Seleccionar Icono' : 'Select Icon'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {ICON_PRESETS.map(iconName => {
                const isSelected = catIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: isSelected ? colors.primaryLight : colors.background,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => setCatIcon(iconName)}
                  >
                    <Ionicons name={iconName as any} size={20} color={isSelected ? colors.primary : colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Add Category Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 0 }, shadows]}
            onPress={handleSaveCategory}
          >
            <Text style={styles.saveBtnText}>
              {language === 'ta' ? 'வகையைச் சேமி' : language === 'hi' ? 'श्रेणी सहेजें' : language === 'es' ? 'Guardar Categoría' : 'Save Category'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save, Reset and Logout Actions */}
        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.xl, gap: 12 }}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, shadows]}
            onPress={handleSaveChanges}
            disabled={updating}
          >
            <Text style={styles.saveBtnText}>{t.saveChanges}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.expenseLight, backgroundColor: colors.card }, shadows]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.expense} style={{ marginRight: 6 }} />
            <Text style={[styles.logoutBtnText, { color: colors.expense }]}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarModal} transparent animationType="slide" onRequestClose={() => setShowAvatarModal(false)} statusBarTranslucent={true}>
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, padding: spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: sizes.h2 }]}>{t.changePhoto}</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Gallery picker option */}
            <TouchableOpacity 
              style={[styles.galleryPickBtn, { backgroundColor: colors.primaryLight, marginBottom: spacing.md }]} 
              onPress={handlePickImage}
            >
              <Ionicons name="image-outline" size={20} color={colors.primaryDark} style={{ marginRight: 8 }} />
              <Text style={[styles.galleryPickText, { color: colors.primaryDark }]}>{t.savedPhoto}</Text>
            </TouchableOpacity>

            <View style={styles.avatarGrid}>
              {AVATARS.map(avatar => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarSelectCard,
                      { backgroundColor: colors.background },
                      isSelected && { borderColor: avatar.color, borderWidth: 2 },
                    ]}
                    onPress={() => {
                      setSelectedAvatar(avatar.id);
                      setShowAvatarModal(false);
                    }}
                  >
                    <View style={[styles.avatarIconCircle, { backgroundColor: avatar.color + '20' }]}>
                      <Ionicons name={avatar.icon as any} size={28} color={avatar.color} />
                    </View>
                    <Text style={[styles.avatarLabel, { color: colors.text }]}>{avatar.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  fieldsContainer: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  preferencesContainer: {
    borderRadius: 24,
    padding: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  prefLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeSelectorGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  selectorBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  selectorBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  currencySelectorGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  currencyBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    minWidth: 90,
  },
  currencyBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  saveBtn: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  logoutBtn: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  galleryPickBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  galleryPickText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  avatarSelectCard: {
    width: '30%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;
