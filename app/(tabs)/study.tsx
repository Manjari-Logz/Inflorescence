import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudy } from '@/hooks/useStudy';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Plus, Trash2, X, BookOpen, FolderOpen } from 'lucide-react-native';

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { domains, loading, addDomain, deleteDomain, addSubject, deleteSubject } = useStudy();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'domain' | 'subject'>('domain');
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#7AA2E3' });

  const handleOpenDomainModal = () => {
    setModalType('domain');
    setFormData({ name: '', color: '#7AA2E3' });
    setModalVisible(true);
  };

  const handleOpenSubjectModal = (domainId: string) => {
    setModalType('subject');
    setSelectedDomainId(domainId);
    setFormData({ name: '', color: '#7AA2E3' });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDomainId(null);
    setFormData({ name: '', color: '#7AA2E3' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    if (modalType === 'domain') {
      await addDomain(formData.name, formData.color);
    } else if (modalType === 'subject' && selectedDomainId) {
      await addSubject(selectedDomainId, formData.name);
    }
    handleCloseModal();
  };

  const handleDeleteDomain = async (id: string) => {
    await deleteDomain(id);
  };

  const handleDeleteSubject = async (id: string, domainId: string) => {
    await deleteSubject(id, domainId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#F7FAFC' ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BookOpen size={32} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Study Chamber</Text>
        </View>

        {/* Add Domain Button */}
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={handleOpenDomainModal}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Study Domain</Text>
        </Pressable>

        {/* Domains List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : domains.length === 0 ? (
          <GlassCard style={styles.emptyCard} padding={Spacing.xl}>
            <BookOpen size={48} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Study Domains</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add domains to track your study progress across different subjects
            </Text>
          </GlassCard>
        ) : (
          domains.map((domain) => (
            <GlassCard key={domain.id} style={styles.domainCard} padding={Spacing.md}>
              <View style={styles.domainHeader}>
                <View style={[styles.colorDot, { backgroundColor: domain.color || colors.accent }]} />
                <Text style={[styles.domainName, { color: colors.text }]}>{domain.name}</Text>
                <Pressable onPress={() => handleDeleteDomain(domain.id)} style={styles.deleteButton}>
                  <Trash2 size={16} color={colors.error} />
                </Pressable>
              </View>
              
              {/* Subjects */}
              {domain.subjects && domain.subjects.length > 0 && (
                <View style={styles.subjectsContainer}>
                  {domain.subjects.map((subject) => (
                    <View key={subject.id} style={styles.subjectItem}>
                      <FolderOpen size={14} color={colors.textSecondary} />
                      <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                      <Text style={[styles.subjectHours, { color: colors.textSecondary }]}>
                        {subject.study_hours}h
                      </Text>
                      <Pressable onPress={() => handleDeleteSubject(subject.id, domain.id)}>
                        <X size={14} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                style={styles.addSubjectButton}
                onPress={() => handleOpenSubjectModal(domain.id)}
              >
                <Plus size={14} color={colors.accent} />
                <Text style={[styles.addSubjectText, { color: colors.accent }]}>Add Subject</Text>
              </Pressable>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalType === 'domain' ? 'Add Domain' : 'Add Subject'}
              </Text>
              <Pressable onPress={handleCloseModal}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <AppInput
              label={modalType === 'domain' ? 'Domain Name' : 'Subject Name'}
              placeholder={modalType === 'domain' ? 'e.g., Mathematics' : 'e.g., Calculus'}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            {modalType === 'domain' && (
              <AppInput
                label="Color"
                placeholder="#7AA2E3"
                value={formData.color}
                onChangeText={(text) => setFormData({ ...formData, color: text })}
              />
            )}

            <PrimaryButton title="Add" onPress={handleSave} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  center: {
    paddingVertical: Spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  domainCard: {
    marginBottom: Spacing.md,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  domainName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: Spacing.sm,
  },
  subjectsContainer: {
    marginTop: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  subjectHours: {
    fontSize: 12,
    marginRight: Spacing.sm,
  },
  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addSubjectText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
});
