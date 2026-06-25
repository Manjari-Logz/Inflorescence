import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Modal, ActivityIndicator, StatusBar, FlatList, Dimensions, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search, SlidersHorizontal, ArrowUpDown, Calendar, Award,
  CheckCircle2, Clock, Trash2, RotateCcw, Tag, Folder, AlertCircle, X, ChevronRight
} from 'lucide-react-native';
import { useTasks } from '@/hooks/useTasks';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppInput } from '@/components/ui/AppInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { HistoryRecord } from '@/services/historyService';

const { width } = Dimensions.get('window');

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#10B981',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Critical: '#EF4444',
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const {
    history,
    historyLoading,
    removeHistory,
    clearHistory,
    restoreTask,
  } = useTasks();

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'priority'>('newest');

  // Detail Modal States
  const [selectedItem, setSelectedItem] = useState<HistoryRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Derive unique categories and projects for filters
  const categories = useMemo(() => {
    const list = new Set<string>();
    history.forEach(item => {
      if (item.category) list.add(item.category);
    });
    return ['All', ...Array.from(list)];
  }, [history]);

  const projects = useMemo(() => {
    const list = new Set<string>();
    history.forEach(item => {
      if (item.project_name) list.add(item.project_name);
    });
    return ['All', ...Array.from(list)];
  }, [history]);

  // Statistics calculation
  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Start of this week (Sunday)
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    sunday.setHours(0, 0, 0, 0);
    const startOfThisWeek = sunday.getTime();

    // Start of this month
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let completedToday = 0;
    let completedThisWeek = 0;
    let completedThisMonth = 0;

    history.forEach(item => {
      const compTime = new Date(item.completed_at).getTime();
      if (compTime >= startOfToday) completedToday++;
      if (compTime >= startOfThisWeek) completedThisWeek++;
      if (compTime >= startOfThisMonth) completedThisMonth++;
    });

    return {
      completedToday,
      completedThisWeek,
      completedThisMonth,
      total: history.length,
    };
  }, [history]);

  // Filtered & Sorted History items
  const processedItems = useMemo(() => {
    let items = [...history];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => {
        return (
          item.task_title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.tags?.some(tag => tag.toLowerCase().includes(q))
        );
      });
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // 3. Priority Filter
    if (selectedPriority !== 'All') {
      items = items.filter(item => item.priority === selectedPriority);
    }

    // 4. Project Filter
    if (selectedProject !== 'All') {
      items = items.filter(item => item.project_name === selectedProject);
    }

    // 5. Sorting
    items.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      }
      if (sortBy === 'alphabetical') {
        return (a.task_title || '').localeCompare(b.task_title || '');
      }
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return 0;
    });

    return items;
  }, [history, searchQuery, selectedCategory, selectedPriority, selectedProject, sortBy]);

  // Group items by time intervals
  const groupedItems = useMemo(() => {
    const grouped: Record<string, HistoryRecord[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Last Week': [],
      'This Month': [],
      'Older': [],
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    sunday.setHours(0, 0, 0, 0);
    const startOfThisWeek = sunday.getTime();
    const startOfLastWeek = startOfThisWeek - 7 * 24 * 60 * 60 * 1000;
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    processedItems.forEach(item => {
      const compTime = new Date(item.completed_at).getTime();
      if (compTime >= startOfToday) {
        grouped['Today'].push(item);
      } else if (compTime >= startOfYesterday) {
        grouped['Yesterday'].push(item);
      } else if (compTime >= startOfThisWeek) {
        grouped['This Week'].push(item);
      } else if (compTime >= startOfLastWeek) {
        grouped['Last Week'].push(item);
      } else if (compTime >= startOfThisMonth) {
        grouped['This Month'].push(item);
      } else {
        grouped['Older'].push(item);
      }
    });

    return Object.keys(grouped).reduce((acc, key) => {
      if (grouped[key].length > 0) {
        acc[key] = grouped[key];
      }
      return acc;
    }, {} as Record<string, HistoryRecord[]>);
  }, [processedItems]);

  const handleSelectItem = (item: HistoryRecord) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const handleRestore = async (item: HistoryRecord) => {
    try {
      const taskId = item.task_id || item.id;
      await restoreTask(taskId);
      setDetailModalVisible(false);
      setSelectedItem(null);
    } catch (e) {
      console.warn('Failed to restore task:', e);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await removeHistory(id);
      setDetailModalVisible(false);
      setSelectedItem(null);
    } catch (e) {
      console.warn('Failed to delete history item:', e);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
    } catch (e) {
      console.warn('Failed to clear history:', e);
    }
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedPriority('All');
    setSelectedProject('All');
    setFilterModalVisible(false);
  };

  // Date format helpers
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#F1F5F9' ? 'light-content' : 'dark-content'} />
      <ScreenHeader title="Task History" subtitle="Reflect on your achievements" showBack />

      {/* Statistics Section */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.completedToday}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today</Text>
          </GlassCard>

          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.completedThisWeek}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Week</Text>
          </GlassCard>

          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.completedThisMonth}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Month</Text>
          </GlassCard>

          <GlassCard style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Completed</Text>
          </GlassCard>
        </ScrollView>
      </View>

      {/* Search and Control Bar */}
      <View style={styles.controlsRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search completed tasks..."
            placeholderTextColor={colors.textDim}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
          onPress={() => setFilterModalVisible(true)}
          hitSlop={8}
        >
          <SlidersHorizontal size={18} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
          onPress={() => {
            const nextSort: Record<string, 'newest' | 'oldest' | 'alphabetical' | 'priority'> = {
              newest: 'oldest',
              oldest: 'alphabetical',
              alphabetical: 'priority',
              priority: 'newest'
            };
            setSortBy(nextSort[sortBy]);
          }}
          hitSlop={8}
        >
          <ArrowUpDown size={18} color={colors.accent} />
        </Pressable>
      </View>

      {/* Sorting indicator banner */}
      <View style={styles.sortIndicatorRow}>
        <Text style={[styles.sortIndicatorText, { color: colors.textMuted }]}>
          Sorting: <Text style={{ color: colors.accent, fontWeight: '600' }}>
            {sortBy === 'newest' ? 'Newest Completed' :
             sortBy === 'oldest' ? 'Oldest Completed' :
             sortBy === 'alphabetical' ? 'Alphabetical' : 'Priority'}
          </Text>
        </Text>
        {history.length > 0 && (
          <Pressable onPress={handleClearHistory} style={styles.clearAllBtn} hitSlop={10}>
            <Trash2 size={13} color={colors.error} />
            <Text style={[styles.clearAllText, { color: colors.error }]}>Clear History</Text>
          </Pressable>
        )}
      </View>

      {/* History Items Grouped list */}
      {historyLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading history...</Text>
        </View>
      ) : processedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Award size={64} color={colors.border} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No completed tasks found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {searchQuery.trim() || selectedCategory !== 'All' || selectedPriority !== 'All'
              ? 'Try modifying your search query or filters'
              : 'Complete active tasks to see your completed history here!'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.listScroll, { paddingBottom: insets.bottom + 20 }]}>
          {Object.keys(groupedItems).map(groupName => (
            <View key={groupName} style={styles.groupContainer}>
              <Text style={[styles.groupTitle, { color: colors.accent }]}>{groupName}</Text>
              
              {groupedItems[groupName].map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectItem(item)}
                  style={({ pressed }) => [
                    styles.itemCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    }
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.checkIconWrapper}>
                      <CheckCircle2 size={20} color="#10B981" fill="rgba(16, 185, 129, 0.1)" />
                    </View>
                    <View style={styles.itemTitleContainer}>
                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.task_title}
                      </Text>
                      <View style={styles.itemMetaRow}>
                        {item.project_name ? (
                          <View style={styles.metaBadge}>
                            <Folder size={11} color={colors.textMuted} />
                            <Text style={[styles.metaBadgeText, { color: colors.textMuted }]} numberOfLines={1}>
                              {item.project_name}
                            </Text>
                          </View>
                        ) : null}
                        <View style={styles.metaBadge}>
                          <Tag size={11} color={colors.textMuted} />
                          <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                            {item.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.itemRightColumn}>
                      <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '15' }]}>
                        <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>
                          {item.priority}
                        </Text>
                      </View>
                      <Text style={[styles.completionTimeText, { color: colors.textMuted }]}>
                        {formatTime(item.completed_at)}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.textMuted} style={styles.arrowIcon} />
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal visible={filterModalVisible} animationType="slide" transparent onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
              <Pressable onPress={() => setFilterModalVisible(false)} hitSlop={12}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Category Filter */}
              <Text style={[styles.filterLabel, { color: colors.text }]}>Category</Text>
              <View style={styles.filterOptions}>
                {categories.map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.filterBadge,
                      { borderColor: colors.border, backgroundColor: colors.surfaceLight },
                      selectedCategory === cat && { backgroundColor: colors.accent, borderColor: colors.accent }
                    ]}
                  >
                    <Text style={[styles.filterBadgeText, { color: selectedCategory === cat ? '#fff' : colors.textSecondary }]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Priority Filter */}
              <Text style={[styles.filterLabel, { color: colors.text }]}>Priority</Text>
              <View style={styles.filterOptions}>
                {['All', 'Low', 'Medium', 'High', 'Critical'].map(prio => (
                  <Pressable
                    key={prio}
                    onPress={() => setSelectedPriority(prio)}
                    style={[
                      styles.filterBadge,
                      { borderColor: colors.border, backgroundColor: colors.surfaceLight },
                      selectedPriority === prio && { backgroundColor: colors.accent, borderColor: colors.accent }
                    ]}
                  >
                    <Text style={[styles.filterBadgeText, { color: selectedPriority === prio ? '#fff' : colors.textSecondary }]}>
                      {prio}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Project Filter */}
              {projects.length > 1 ? (
                <>
                  <Text style={[styles.filterLabel, { color: colors.text }]}>Project</Text>
                  <View style={styles.filterOptions}>
                    {projects.map(proj => (
                      <Pressable
                        key={proj}
                        onPress={() => setSelectedProject(proj)}
                        style={[
                          styles.filterBadge,
                          { borderColor: colors.border, backgroundColor: colors.surfaceLight },
                          selectedProject === proj && { backgroundColor: colors.accent, borderColor: colors.accent }
                        ]}
                      >
                        <Text style={[styles.filterBadgeText, { color: selectedProject === proj ? '#fff' : colors.textSecondary }]}>
                          {proj}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderLight }]}>
              <Pressable style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetFilters}>
                <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Reset All</Text>
              </Pressable>
              <Pressable style={[styles.applyBtn, { backgroundColor: colors.accent }]} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* DETAIL MODAL (Read-Only) */}
      <Modal visible={detailModalVisible} animationType="fade" transparent onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.detailOverlay}>
          <GlassCard style={[styles.detailContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.detailHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: selectedItem ? PRIORITY_COLORS[selectedItem.priority] + '15' : 'transparent' }]}>
                <Text style={[styles.priorityText, { color: selectedItem ? PRIORITY_COLORS[selectedItem.priority] : colors.textMuted }]}>
                  {selectedItem?.priority} Priority
                </Text>
              </View>
              <Pressable onPress={() => setDetailModalVisible(false)} hitSlop={12}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.detailScrollBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedItem?.task_title}</Text>
              
              <View style={styles.timeInfoRow}>
                <Clock size={14} color={colors.textMuted} />
                <Text style={[styles.timeInfoText, { color: colors.textMuted }]}>
                  Completed: <Text style={{ color: colors.text, fontWeight: '500' }}>{selectedItem ? formatDate(selectedItem.completed_at) : ''} at {selectedItem ? formatTime(selectedItem.completed_at) : ''}</Text>
                </Text>
              </View>

              {selectedItem?.description ? (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Description</Text>
                  <Text style={[styles.sectionText, { color: colors.text }]}>{selectedItem.description}</Text>
                </View>
              ) : null}

              {selectedItem?.notes ? (
                <View style={styles.detailSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Notes</Text>
                  <Text style={[styles.sectionText, { color: colors.text }]}>{selectedItem.notes}</Text>
                </View>
              ) : null}

              <View style={styles.metaGrid}>
                <View style={[styles.gridCell, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Category</Text>
                  <Text style={[styles.gridValue, { color: colors.text }]}>{selectedItem?.category}</Text>
                </View>

                {selectedItem?.project_name ? (
                  <View style={[styles.gridCell, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                    <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Project</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]}>{selectedItem.project_name}</Text>
                  </View>
                ) : null}

                <View style={[styles.gridCell, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Estimated Time</Text>
                  <Text style={[styles.gridValue, { color: colors.text }]}>{selectedItem?.estimated_time} hrs</Text>
                </View>

                {selectedItem?.completed_by ? (
                  <View style={[styles.gridCell, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
                    <Text style={[styles.gridLabel, { color: colors.textMuted }]}>Completed By</Text>
                    <Text style={[styles.gridValue, { color: colors.text }]} numberOfLines={1}>{selectedItem.completed_by}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.timeInfoRow}>
                <Calendar size={14} color={colors.textMuted} />
                <Text style={[styles.timeInfoText, { color: colors.textMuted }]}>
                  Created At: <Text style={{ color: colors.textSecondary }}>{selectedItem ? formatDate(selectedItem.created_at) : ''}</Text>
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.detailFooter, { borderTopColor: colors.borderLight }]}>
              {selectedItem ? (
                <Pressable
                  style={[styles.deleteHistoryBtn, { borderColor: colors.error + '40' }]}
                  onPress={() => handleDeleteHistory(selectedItem.id)}
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text style={[styles.deleteHistoryBtnText, { color: colors.error }]}>Delete Log</Text>
                </Pressable>
              ) : null}

              {selectedItem ? (
                <Pressable
                  style={[styles.restoreTaskBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleRestore(selectedItem)}
                >
                  <RotateCcw size={16} color="#FFFFFF" />
                  <Text style={styles.restoreTaskBtnText}>Restore Task</Text>
                </Pressable>
              ) : null}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  statsContainer: {
    paddingVertical: Spacing.sm,
  },
  statsScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  statCard: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
  },
  sortIndicatorText: {
    fontSize: 12,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  groupContainer: {
    gap: Spacing.xs,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconWrapper: {
    marginRight: Spacing.sm,
  },
  itemTitleContainer: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    maxWidth: 100,
  },
  metaBadgeText: {
    fontSize: 11,
  },
  itemRightColumn: {
    alignItems: 'flex-end',
    gap: 4,
    marginRight: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completionTimeText: {
    fontSize: 11,
  },
  arrowIcon: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Detail Overlay
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  detailContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailScrollBody: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeInfoText: {
    fontSize: 12,
  },
  detailSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  gridCell: {
    width: '48%',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 2,
  },
  gridLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  deleteHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  deleteHistoryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  restoreTaskBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  restoreTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
