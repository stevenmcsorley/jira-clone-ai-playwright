/**
 * Notification State Machine
 *
 * Manages notification state with XState for watching issues,
 * handling real-time notifications, and optimistic updates.
 */

import { setup, assign } from 'xstate';
import { Notification, IssueWatcher, NotificationPreferences } from '../types/domain.types';

// Context for the notification machine
export interface NotificationContext {
  notifications: Notification[];
  watchers: IssueWatcher[];
  preferences: NotificationPreferences | null;
  unreadCount: number;
  isLoading: boolean;
  error?: string;
  optimisticUpdates: Map<string, any>; // Track optimistic operations
}

// Events for notification management
export type NotificationEvents =
  | { type: 'LOAD_NOTIFICATIONS' }
  | { type: 'WATCH_ISSUE'; issueId: number; userId: number }
  | { type: 'UNWATCH_ISSUE'; issueId: number; userId: number }
  | { type: 'MARK_AS_READ'; notificationId: number }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'NEW_NOTIFICATION'; notification: Notification }
  | { type: 'UPDATE_PREFERENCES'; preferences: Partial<NotificationPreferences> }
  | { type: 'API_SUCCESS'; data: any; operation: string }
  | { type: 'API_ERROR'; error: string; operation: string }
  | { type: 'RETRY' };

// Machine setup
export const notificationMachine = setup({
  types: {
    context: {} as NotificationContext,
    events: {} as NotificationEvents,
  },
  guards: {
    hasNotifications: ({ context }) => context.notifications.length > 0,
    hasUnreadNotifications: ({ context }) => context.unreadCount > 0,
    isWatchingIssue: ({ context }, params: { issueId: number; userId: number }) => {
      return context.watchers.some(w => w.issueId === params.issueId && w.userId === params.userId);
    },
    hasError: ({ context }) => !!context.error,
  },
  actions: {
    // State management actions
    setLoading: assign({
      isLoading: true,
      error: undefined,
    }),
    clearLoading: assign({
      isLoading: false,
    }),
    setError: assign({
      error: (_, params: { error: string }) => params.error,
      isLoading: false,
    }),
    clearError: assign({
      error: undefined,
    }),

    // Notification actions
    addNotification: assign({
      notifications: ({ context }, params: { notification: Notification }) => [
        params.notification,
        ...context.notifications,
      ],
      unreadCount: ({ context }) => context.unreadCount + 1,
    }),
    setNotifications: assign({
      notifications: (_, params: { notifications: Notification[] }) => params.notifications,
      unreadCount: (_, params: { notifications: Notification[] }) =>
        params.notifications.filter(n => !n.isRead).length,
    }),
    markAsRead: assign({
      notifications: ({ context }, params: { notificationId: number }) =>
        context.notifications.map(n =>
          n.id === params.notificationId ? { ...n, isRead: true } : n
        ),
      unreadCount: ({ context }) => Math.max(0, context.unreadCount - 1),
    }),
    markAllAsRead: assign({
      notifications: ({ context }) =>
        context.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }),
    clearAllNotifications: assign({
      notifications: [],
      unreadCount: 0,
    }),

    // Watcher actions
    addOptimisticWatch: assign({
      watchers: ({ context }, params: { issueId: number; userId: number }) => [
        ...context.watchers,
        {
          id: Date.now(), // Temporary ID
          issueId: params.issueId,
          userId: params.userId,
          autoWatched: false,
          createdAt: new Date(),
        },
      ],
      optimisticUpdates: ({ context }, params: { issueId: number; userId: number }) => {
        const updates = new Map(context.optimisticUpdates);
        updates.set(`watch_${params.issueId}_${params.userId}`, { type: 'watch', issueId: params.issueId });
        return updates;
      },
    }),
    removeOptimisticWatch: assign({
      watchers: ({ context }, params: { issueId: number; userId: number }) =>
        context.watchers.filter(w => !(w.issueId === params.issueId && w.userId === params.userId)),
      optimisticUpdates: ({ context }, params: { issueId: number; userId: number }) => {
        const updates = new Map(context.optimisticUpdates);
        updates.set(`unwatch_${params.issueId}_${params.userId}`, { type: 'unwatch', issueId: params.issueId });
        return updates;
      },
    }),
    clearOptimisticUpdate: assign({
      optimisticUpdates: ({ context }, params: { key: string }) => {
        const updates = new Map(context.optimisticUpdates);
        updates.delete(params.key);
        return updates;
      },
    }),
    setWatchers: assign({
      watchers: (_, params: { watchers: IssueWatcher[] }) => params.watchers,
    }),

    // Preferences actions
    setPreferences: assign({
      preferences: (_, params: { preferences: NotificationPreferences }) => params.preferences,
    }),
    updatePreferences: assign({
      preferences: ({ context }, params: { preferences: Partial<NotificationPreferences> }) =>
        context.preferences ? { ...context.preferences, ...params.preferences } : null,
    }),

    // Side effects
    notifyOptimisticUpdate: ({ context }, params: { operation: string; issueId?: number }) => {
      console.log('🔄 Optimistic update:', params.operation, {
        issueId: params.issueId,
        optimisticUpdates: context.optimisticUpdates.size,
      });
    },
    logNotificationReceived: (_, params: { notification: Notification }) => {
      console.log('🔔 New notification received:', params.notification.title);
    },
  },
  actors: {
    // API actors for real operations
    loadNotifications: () => {
      return new Promise<Notification[]>((resolve) => {
        // Simulate API call
        setTimeout(() => {
          const mockNotifications: Notification[] = [
            {
              id: 1,
              type: 'issue_assigned',
              title: 'Issue assigned to you',
              message: 'JCD-133 has been assigned to you',
              issueId: 133,
              userId: 1,
              isRead: false,
              createdAt: new Date(Date.now() - 300000), // 5 minutes ago
              updatedAt: new Date(),
            },
            {
              id: 2,
              type: 'issue_status_changed',
              title: 'Issue status changed',
              message: 'JCD-134 moved to Done',
              issueId: 134,
              userId: 1,
              isRead: true,
              createdAt: new Date(Date.now() - 600000), // 10 minutes ago
              updatedAt: new Date(),
            },
          ];
          resolve(mockNotifications);
        }, 500);
      });
    },
    toggleWatchAPI: ({ context }, params: { issueId: number; userId: number; shouldWatch: boolean }) => {
      return new Promise<IssueWatcher[]>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) { // 90% success rate
            console.log('✅ Watch toggle successful:', { issueId: params.issueId, shouldWatch: params.shouldWatch });
            resolve(context.watchers); // Return updated watchers
          } else {
            reject(new Error('Failed to toggle watch status'));
          }
        }, 800);
      });
    },
    updateNotificationAPI: ({ context }, params: { notificationId: number; updates: any }) => {
      return new Promise<Notification[]>((resolve) => {
        setTimeout(() => {
          const updated = context.notifications.map(n =>
            n.id === params.notificationId ? { ...n, ...params.updates } : n
          );
          resolve(updated);
        }, 300);
      });
    },
  },
}).createMachine({
  id: 'notifications',
  initial: 'idle',
  context: {
    notifications: [],
    watchers: [],
    preferences: null,
    unreadCount: 0,
    isLoading: false,
    optimisticUpdates: new Map(),
  },
  states: {
    idle: {
      on: {
        LOAD_NOTIFICATIONS: { target: 'loading' },
        WATCH_ISSUE: { target: 'watchingIssue' },
        UNWATCH_ISSUE: { target: 'unwatchingIssue' },
        MARK_AS_READ: { target: 'markingAsRead' },
        MARK_ALL_AS_READ: { target: 'markingAllAsRead' },
        CLEAR_ALL_NOTIFICATIONS: { actions: ['clearAllNotifications'] },
        NEW_NOTIFICATION: {
          actions: ['addNotification', 'logNotificationReceived'],
        },
      },
    },

    loading: {
      entry: ['setLoading'],
      invoke: {
        src: 'loadNotifications',
        onDone: {
          target: 'idle',
          actions: [
            'clearLoading',
            { type: 'setNotifications', params: ({ event }) => ({ notifications: event.output }) },
          ],
        },
        onError: {
          target: 'error',
          actions: [{ type: 'setError', params: { error: 'Failed to load notifications' } }],
        },
      },
    },

    watchingIssue: {
      entry: [
        'addOptimisticWatch',
        { type: 'notifyOptimisticUpdate', params: { operation: 'watch' } },
      ],
      invoke: {
        src: 'toggleWatchAPI',
        input: ({ event }) => ({
          issueId: (event as any).issueId,
          userId: (event as any).userId,
          shouldWatch: true,
        }),
        onDone: {
          target: 'idle',
          actions: [
            { type: 'setWatchers', params: ({ event }) => ({ watchers: event.output }) },
            { type: 'clearOptimisticUpdate', params: ({ event }) => ({
              key: `watch_${(event as any).input.issueId}_${(event as any).input.userId}`
            }) },
          ],
        },
        onError: {
          target: 'idle',
          actions: [
            { type: 'removeOptimisticWatch', params: ({ event }) => ({
              issueId: (event as any).input.issueId,
              userId: (event as any).input.userId,
            }) },
            { type: 'setError', params: { error: 'Failed to watch issue' } },
          ],
        },
      },
    },

    unwatchingIssue: {
      entry: [
        'removeOptimisticWatch',
        { type: 'notifyOptimisticUpdate', params: { operation: 'unwatch' } },
      ],
      invoke: {
        src: 'toggleWatchAPI',
        input: ({ event }) => ({
          issueId: (event as any).issueId,
          userId: (event as any).userId,
          shouldWatch: false,
        }),
        onDone: {
          target: 'idle',
          actions: [
            { type: 'setWatchers', params: ({ event }) => ({ watchers: event.output }) },
            { type: 'clearOptimisticUpdate', params: ({ event }) => ({
              key: `unwatch_${(event as any).input.issueId}_${(event as any).input.userId}`
            }) },
          ],
        },
        onError: {
          target: 'idle',
          actions: [
            { type: 'addOptimisticWatch', params: ({ event }) => ({
              issueId: (event as any).input.issueId,
              userId: (event as any).input.userId,
            }) },
            { type: 'setError', params: { error: 'Failed to unwatch issue' } },
          ],
        },
      },
    },

    markingAsRead: {
      entry: [
        { type: 'markAsRead', params: ({ event }) => ({ notificationId: (event as any).notificationId }) },
      ],
      invoke: {
        src: 'updateNotificationAPI',
        input: ({ event }) => ({
          notificationId: (event as any).notificationId,
          updates: { isRead: true },
        }),
        onDone: { target: 'idle' },
        onError: { target: 'idle' }, // Optimistic update already applied
      },
    },

    markingAllAsRead: {
      entry: ['markAllAsRead'],
      // Note: In real implementation, would call API to mark all as read
      always: { target: 'idle' },
    },

    error: {
      on: {
        RETRY: { target: 'loading' },
        LOAD_NOTIFICATIONS: { target: 'loading' },
      },
    },
  },
});