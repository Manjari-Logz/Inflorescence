import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { tasksService, Task } from '@/services/tasksService';
import { badgesService } from '@/services/badgesService';
import { historyService, HistoryRecord } from '@/services/historyService';
import { notificationsService } from '@/services/notificationsService';

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (input: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<{ badge?: string; badgeName?: string } | null>;
  archiveTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  
  // History Fields & Methods
  history: HistoryRecord[];
  historyLoading: boolean;
  addHistory: (record: Omit<HistoryRecord, 'id' | 'created_at'>) => Promise<void>;
  removeHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  searchHistory: (query: string) => HistoryRecord[];
  filterHistory: (criteria: {
    projectId?: string;
    category?: string;
    priority?: string;
    tag?: string;
    startDate?: string;
    endDate?: string;
  }) => HistoryRecord[];
  refreshHistory: () => Promise<void>;
}

export const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await tasksService.fetch(user.id);
    if (data) setTasks(data);
    setLoading(false);
    
    // Reschedule notifications for recurring tasks with reminders
    // Only reschedule if notificationId is missing (prevents duplicate scheduling on app restart)
    const hasPermission = await notificationsService.requestPermissions();
    if (hasPermission && data) {
      for (const task of data) {
        if (task.repeatType === 'daily' && task.reminderEnabled && task.reminderTime && !task.notificationId) {
          const notificationId = await notificationsService.scheduleDailyReminder(
            task.id,
            task.title,
            task.reminderTime
          );
          if (notificationId) {
            await tasksService.update(task.id, { notificationId });
          }
        }
      }
    }
  }, [user]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data } = await historyService.fetch(user.id);
    if (data) setHistory(data);
    setHistoryLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      load();
      loadHistory();
    } else {
      setTasks([]);
      setHistory([]);
    }
  }, [user, load, loadHistory]);

  const addTask = async (input: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimistic: Task = { ...input, id: tempId, user_id: user.id, created_at: new Date().toISOString() };
    setTasks(prev => [optimistic, ...prev]);
    const { data, error } = await tasksService.create({ ...input, user_id: user.id });
    if (data) {
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
      await addNotification('Task Created', `You created a new task: ${input.title}`);
      
      // Schedule reminder if enabled for recurring task
      if (data.repeatType === 'daily' && data.reminderEnabled && data.reminderTime) {
        // Request notification permissions before scheduling
        const hasPermission = await notificationsService.requestPermissions();
        if (hasPermission) {
          const notificationId = await notificationsService.scheduleDailyReminder(
            data.id,
            data.title,
            data.reminderTime
          );
          if (notificationId) {
            await tasksService.update(data.id, { notificationId });
            setTasks(prev => prev.map(t => t.id === tempId ? { ...data, notificationId } : t));
          }
        }
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const { error } = await tasksService.update(id, updates);
    if (error) {
      await load(); // revert on error
      return;
    }

    // Handle reminder scheduling for recurring tasks
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updatedTask = { ...task, ...updates };
      
      // Determine if notification should be scheduled
      const shouldSchedule = updatedTask.repeatType === 'daily' && updatedTask.reminderEnabled && updatedTask.reminderTime;
      const wasScheduled = task.repeatType === 'daily' && task.reminderEnabled && task.reminderTime;
      const timeChanged = task.reminderTime !== updatedTask.reminderTime;
      
      // Cancel existing notification if conditions changed
      if (task.notificationId && (!shouldSchedule || timeChanged)) {
        await notificationsService.cancelNotificationById(task.notificationId);
        await tasksService.update(id, { notificationId: undefined });
        setTasks(prev => prev.map(t => t.id === id ? { ...t, notificationId: undefined } : t));
      }
      
      // Schedule new notification if needed
      if (shouldSchedule && (!wasScheduled || timeChanged)) {
        const notificationId = await notificationsService.scheduleDailyReminder(
          id,
          updatedTask.title,
          updatedTask.reminderTime!
        );
        if (notificationId) {
          await tasksService.update(id, { notificationId });
          setTasks(prev => prev.map(t => t.id === id ? { ...t, notificationId } : t));
        }
      }
    }
  };

  const removeTask = async (id: string) => {
    // Cancel notification if task has one
    const task = tasks.find(t => t.id === id);
    if (task?.notificationId) {
      await notificationsService.cancelNotificationById(task.notificationId);
    }
    
    setTasks(prev => prev.filter(t => t.id !== id));
    const { error } = await tasksService.remove(id);
    if (error) await load();
  };

  const completeTask = async (id: string): Promise<{ badge?: string; badgeName?: string } | null> => {
    if (!user) return null;
    
    // Find task details to store in history
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    // Handle recurring tasks differently
    const isRecurring = task.repeatType === 'daily';
    const isCompletedForToday = tasksService.isCompletedForToday(task);
    
    // For recurring tasks, only add history if not already completed today
    const shouldAddHistory = !isRecurring || !isCompletedForToday;
    
    // Check duplicate history for non-recurring tasks
    const isDuplicate = !isRecurring && history.some(h => h.task_id === id);

    // Use service helper to get proper completion updates
    const completionUpdates = tasksService.completeForToday(task);
    const completedAt = completionUpdates.completed_at || new Date().toISOString();

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...completionUpdates } : t));
    const { error } = await tasksService.update(id, completionUpdates);
    if (error) {
      await load();
      return null;
    }

    // Insert history record for non-recurring tasks or first completion of recurring task
    if (shouldAddHistory && !isDuplicate) {
      const historyInput = {
        task_id: task.id,
        user_id: user.id,
        task_title: task.title,
        description: task.description || '',
        project_id: undefined,
        project_name: undefined,
        category: task.category || 'General',
        priority: task.priority || 'Medium',
        tags: [],
        notes: task.notes || '',
        estimated_time: task.estimated_time || 0,
        actual_time: 0,
        completed_at: completedAt,
        archived: task.archived || false,
        completed_by: user.email || undefined,
      };

      const { data: historyData, error: historyError } = await historyService.create(historyInput);
      if (historyError) {
        console.warn('[TasksContext] Failed to automatically record completed task to history:', historyError);
      } else if (historyData) {
        setHistory(prev => [historyData, ...prev]);
      }
      await addNotification('Task Completed', `Great job! You completed: ${task.title}`);
    }

    // Only award badges for non-recurring tasks or first completion
    if (!isRecurring || !isCompletedForToday) {
      const completedCount = tasks.filter(t => t.completed).length + 1;
      const result = await badgesService.checkAndAwardTaskBadge(user.id, completedCount);
      if (result.awarded) {
        const badgeName = 'name' in result ? result.name : result.type;
        return { badge: result.type, badgeName };
      }
    }
    return null;
  };

  const archiveTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: true } : t));
    await tasksService.update(id, { archived: true } as any);
  };

  const restoreTask = async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    
    if (task && tasksService.isCompletedForToday(task)) {
      // For recurring tasks, just unmark today's completion
      if (task.repeatType === 'daily') {
        const uncompleteUpdates = tasksService.uncompleteForToday(task);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...uncompleteUpdates, archived: false } : t));
        const { error } = await tasksService.update(id, { ...uncompleteUpdates, archived: false });
        if (error) await load();
        return;
      }
      
      // For non-recurring tasks, remove history and set incomplete
      await historyService.removeByTaskId(id);
      setHistory(prev => prev.filter(h => h.task_id !== id));

      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: false, completed_at: undefined, archived: false } : t));
      const { error } = await tasksService.update(id, { completed: false, completed_at: undefined, archived: false });
      if (error) await load();
    } else {
      // Check if it's in history but missing from local task list (e.g. deleted task)
      const histRecord = history.find(h => h.task_id === id || h.id === id);
      if (histRecord) {
        const taskId = histRecord.task_id || id;
        
        // Remove history record
        await historyService.remove(histRecord.id);
        setHistory(prev => prev.filter(h => h.id !== histRecord.id));

        // Recreate the task as incomplete
        const taskInput = {
          user_id: user.id,
          title: histRecord.task_title,
          description: histRecord.description || '',
          category: histRecord.category || 'General',
          priority: histRecord.priority || 'Medium',
          notes: histRecord.notes || '',
          estimated_time: histRecord.estimated_time || 0,
          progress: 0,
          completed: false,
          archived: false,
        };

        const { data: newTask, error: createError } = await tasksService.create(taskInput);
        if (!createError && newTask) {
          setTasks(prev => [newTask, ...prev]);
        } else {
          console.warn('[TasksContext] Failed to recreate restored task:', createError);
          await load();
        }
      } else {
        // Just unarchive if it's not completed/in history
        setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: false } : t));
        const { error } = await tasksService.update(id, { archived: false } as any);
        if (error) await load();
      }
    }
  };

  // Add History manual methods
  const addHistory = async (record: Omit<HistoryRecord, 'id' | 'created_at'>) => {
    if (!user) return;
    const { data, error } = await historyService.create({ ...record, user_id: user.id });
    if (data) {
      setHistory(prev => [data, ...prev]);
    } else {
      console.warn('[TasksContext] addHistory error:', error);
    }
  };

  const removeHistory = async (id: string) => {
    const { error } = await historyService.remove(id);
    if (!error) {
      setHistory(prev => prev.filter(h => h.id !== id));
    } else {
      console.warn('[TasksContext] removeHistory error:', error);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    const { error } = await historyService.clearAll(user.id);
    if (!error) {
      setHistory([]);
    } else {
      console.warn('[TasksContext] clearHistory error:', error);
    }
  };

  const searchHistory = useCallback((query: string) => {
    if (!query.trim()) return history;
    const q = query.toLowerCase().trim();
    return history.filter(item => {
      const titleMatch = item.task_title?.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const notesMatch = item.notes?.toLowerCase().includes(q);
      const categoryMatch = item.category?.toLowerCase().includes(q);
      const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(q));
      return titleMatch || descMatch || notesMatch || categoryMatch || tagsMatch;
    });
  }, [history]);

  const filterHistory = useCallback((criteria: {
    projectId?: string;
    category?: string;
    priority?: string;
    tag?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return history.filter(item => {
      if (criteria.projectId && item.project_id !== criteria.projectId) return false;
      if (criteria.category && item.category !== criteria.category) return false;
      if (criteria.priority && item.priority !== criteria.priority) return false;
      if (criteria.tag && !item.tags?.includes(criteria.tag)) return false;
      if (criteria.startDate) {
        const start = new Date(criteria.startDate);
        const completed = new Date(item.completed_at);
        if (completed < start) return false;
      }
      if (criteria.endDate) {
        const end = new Date(criteria.endDate);
        end.setHours(23, 59, 59, 999);
        const completed = new Date(item.completed_at);
        if (completed > end) return false;
      }
      return true;
    });
  }, [history]);

  return (
    <TasksContext.Provider value={{
      tasks,
      loading,
      addTask,
      updateTask,
      removeTask,
      completeTask,
      archiveTask,
      restoreTask,
      refresh: load,
      
      // History Exports
      history,
      historyLoading,
      addHistory,
      removeHistory,
      clearHistory,
      searchHistory,
      filterHistory,
      refreshHistory: loadHistory,
    }}>
      {children}
    </TasksContext.Provider>
  );
}
