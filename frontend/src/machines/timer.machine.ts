/**
 * XState-based Issue Timer Machine
 *
 * Automatically manages timing for issues based on status changes.
 * Each issue gets its own timer actor for distributed timing.
 */

import { createMachine, assign, fromCallback } from 'xstate';
import { TimeTrackingService } from '../services/api/time-tracking.service';

// Timer context interface
interface TimerContext {
  issueId: number;
  startTime: number | null;
  totalElapsed: number; // in milliseconds
  estimate: number; // in hours
  lastPauseTime: number | null;
  accumulatedTime: number; // time from previous sessions
}

// Timer events
type TimerEvent =
  | { type: 'START_WORK'; issueId: number; estimate?: number }
  | { type: 'PAUSE_WORK' }
  | { type: 'RESUME_WORK' }
  | { type: 'COMPLETE_WORK' }
  | { type: 'TICK' }
  | { type: 'SYNC_TIME' };

// Create a ticker service that emits every second
const tickerService = fromCallback(({ sendBack }) => {
  const interval = setInterval(() => {
    sendBack({ type: 'TICK' });
  }, 1000);

  return () => clearInterval(interval);
});

// Auto-save service that syncs to backend every 30 seconds
const autoSaveService = fromCallback(({ sendBack, input }) => {
  const interval = setInterval(() => {
    sendBack({ type: 'SYNC_TIME' });
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
});

// Main timer machine
export const timerMachine = createMachine(
  {
    id: 'issueTimer',
    types: {
      context: {} as TimerContext,
      events: {} as TimerEvent,
    },
    initial: 'idle',
    context: {
      issueId: 0,
      startTime: null,
      totalElapsed: 0,
      estimate: 0,
      lastPauseTime: null,
      accumulatedTime: 0,
    },
    states: {
      idle: {
        on: {
          START_WORK: {
            target: 'running',
            actions: 'initializeTimer',
          },
        },
      },
      running: {
        invoke: [
          {
            id: 'ticker',
            src: tickerService,
          },
          {
            id: 'autoSave',
            src: autoSaveService,
          },
        ],
        on: {
          TICK: {
            actions: 'updateElapsedTime',
          },
          PAUSE_WORK: {
            target: 'paused',
            actions: 'pauseTimer',
          },
          COMPLETE_WORK: {
            target: 'completing',
            actions: 'finalizeTime',
          },
          SYNC_TIME: {
            actions: 'syncToBackend',
          },
        },
      },
      paused: {
        on: {
          RESUME_WORK: {
            target: 'running',
            actions: 'resumeTimer',
          },
          COMPLETE_WORK: {
            target: 'completing',
            actions: 'finalizeTime',
          },
        },
      },
      completing: {
        invoke: {
          id: 'saveTimeLog',
          src: 'saveTimeToAPI',
          onDone: {
            target: 'completed',
          },
          onError: {
            target: 'error',
            actions: 'handleSaveError',
          },
        },
      },
      completed: {
        type: 'final',
        data: ({ context }) => ({
          totalHours: context.totalElapsed / (1000 * 60 * 60),
          issueId: context.issueId,
        }),
      },
      error: {
        on: {
          START_WORK: {
            target: 'running',
            actions: 'initializeTimer',
          },
        },
      },
    },
  },
  {
    actions: {
      initializeTimer: assign({
        issueId: ({ event }) =>
          event.type === 'START_WORK' ? event.issueId : 0,
        estimate: ({ event }) =>
          event.type === 'START_WORK' ? event.estimate || 0 : 0,
        startTime: () => Date.now(),
        totalElapsed: 0,
        lastPauseTime: null,
      }),

      updateElapsedTime: assign({
        totalElapsed: ({ context }) => {
          if (!context.startTime) return context.totalElapsed;
          return context.accumulatedTime + (Date.now() - context.startTime);
        },
      }),

      pauseTimer: assign({
        accumulatedTime: ({ context }) => {
          if (!context.startTime) return context.accumulatedTime;
          return context.accumulatedTime + (Date.now() - context.startTime);
        },
        lastPauseTime: () => Date.now(),
        startTime: null,
      }),

      resumeTimer: assign({
        startTime: () => Date.now(),
        lastPauseTime: null,
      }),

      finalizeTime: assign({
        totalElapsed: ({ context }) => {
          if (!context.startTime) return context.accumulatedTime;
          return context.accumulatedTime + (Date.now() - context.startTime);
        },
      }),

      syncToBackend: ({ context }) => {
        // Background sync for active timers (non-blocking)
        if (context.totalElapsed > 0) {
          console.log(`Syncing timer for issue ${context.issueId}: ${context.totalElapsed}ms`);
        }
      },

      handleSaveError: (_, params) => {
        console.error('Failed to save time log:', params.data);
      },
    },

    actors: {
      saveTimeToAPI: fromCallback(async ({ input, sendBack }) => {
        const { issueId, totalElapsed } = input as TimerContext;
        const hours = totalElapsed / (1000 * 60 * 60);

        if (hours < 0.001) return; // Don't log very short times (less than 3.6 seconds)

        try {
          await TimeTrackingService.logTime({
            issueId,
            hours: Math.round(hours * 1000) / 1000, // Round to 0.001h
            description: `Automatic time tracking session`,
            date: new Date().toISOString(),
          });
        } catch (error) {
          throw error;
        }
      }),
    },
  }
);

// Timer persistence helpers
const TIMER_STORAGE_KEY = 'jira-clone-active-timers';

const saveTimersToStorage = (timers: Map<number, any>) => {
  try {
    // Only persist timers that are running or paused (not completed)
    const activeTimerArray = Array.from(timers.entries())
      .filter(([_, timer]) => timer.status === 'running' || timer.status === 'paused')
      .map(([id, timer]) => [id, timer]);

    if (activeTimerArray.length > 0) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(activeTimerArray));
      console.log(`💾 Saved ${activeTimerArray.length} active timers to localStorage`);
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      console.log(`🗑️ Cleared localStorage (no active timers)`);
    }
  } catch (error) {
    console.error('Failed to save timers to localStorage:', error);
  }
};

const loadTimersFromStorage = (): Map<number, any> => {
  try {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY);
    if (stored) {
      const timerArray = JSON.parse(stored);
      const timers = new Map(timerArray);
      console.log(`📁 Loaded ${timers.size} timers from localStorage`);

      // Restore running timers - adjust start times to account for time away
      const now = Date.now();
      for (const timer of timers.values()) {
        if (timer.status === 'running' && timer.startTime) {
          // Time elapsed since page refresh
          const timeAway = now - timer.startTime;
          // Add time away to accumulated time and reset start time
          timer.totalElapsed += timeAway;
          timer.startTime = now;
          console.log(`🔄 Restored running timer for issue ${timer.issueId}, added ${timeAway}ms from time away`);
        }
      }

      return timers;
    }
  } catch (error) {
    console.error('Failed to load timers from localStorage:', error);
  }
  return new Map();
};

// Simplified Timer Manager Machine
export const timerManagerMachine = createMachine(
  {
    id: 'timerManager',
    types: {
      context: {} as {
        activeTimers: Map<number, {
          issueId: number;
          startTime: number | null;
          totalElapsed: number;
          estimate: number;
          status: 'running' | 'paused' | 'completed';
        }>;
        totalActiveTime: number;
      },
      events: {} as
        | { type: 'ISSUE_STATUS_CHANGED'; issueId: number; newStatus: string; estimate?: number }
        | { type: 'GET_TIMER_STATE'; issueId: number }
        | { type: 'FORCE_STOP_TIMER'; issueId: number }
        | { type: 'TICK' }
        | { type: 'RESTORE_TIMERS' },
    },
    initial: 'managing',
    context: {
      activeTimers: loadTimersFromStorage(), // Load from localStorage on init
      totalActiveTime: 0,
    },
    states: {
      managing: {
        invoke: {
          id: 'globalTicker',
          src: fromCallback(({ sendBack }) => {
            const interval = setInterval(() => {
              sendBack({ type: 'TICK' });
            }, 1000);
            return () => clearInterval(interval);
          }),
        },
        on: {
          ISSUE_STATUS_CHANGED: {
            actions: 'handleStatusChange',
          },
          FORCE_STOP_TIMER: {
            actions: 'forceStopTimer',
          },
          TICK: {
            actions: 'updateTimers',
          },
        },
      },
    },
  },
  {
    actions: {
      handleStatusChange: assign(({ context, event }) => {
        const { issueId, newStatus, estimate } = event;
        const existingTimer = context.activeTimers.get(issueId);

        switch (newStatus) {
          case 'in_progress':
            if (!existingTimer) {
              // Start new timer
              console.log(`🚀 Starting new timer for issue ${issueId}`);
              context.activeTimers.set(issueId, {
                issueId,
                startTime: Date.now(),
                totalElapsed: 0,
                estimate: estimate || 0,
                status: 'running',
              });
            } else {
              // Resume or restart existing timer
              if (existingTimer.status === 'completed') {
                // Reset for new session
                console.log(`🔄 Restarting completed timer for issue ${issueId}`);
                existingTimer.totalElapsed = 0;
              } else {
                console.log(`▶️ Resuming paused timer for issue ${issueId}`);
              }
              existingTimer.startTime = Date.now();
              existingTimer.status = 'running';
              existingTimer.estimate = estimate || existingTimer.estimate;
            }
            break;

          case 'todo':
            if (existingTimer && existingTimer.status === 'running') {
              // Pause timer - accumulate elapsed time
              const now = Date.now();
              if (existingTimer.startTime) {
                existingTimer.totalElapsed += now - existingTimer.startTime;
              }
              existingTimer.startTime = null;
              existingTimer.status = 'paused';
            }
            break;

          case 'done':
            if (existingTimer) {
              // Complete timer
              if (existingTimer.status === 'running' && existingTimer.startTime) {
                existingTimer.totalElapsed += Date.now() - existingTimer.startTime;
              }
              existingTimer.status = 'completed';
              existingTimer.startTime = null;

              // Auto-log time but keep timer for future restarts
              const sessionHours = existingTimer.totalElapsed / (1000 * 60 * 60);
              console.log(`🕐 Timer completed for issue ${issueId}: ${sessionHours} hours (${existingTimer.totalElapsed}ms)`);

              if (sessionHours >= 0.001) { // Reduced from 0.01 to 0.001 (3.6 seconds)
                console.log(`✅ Logging time for issue ${issueId}: ${sessionHours} hours`);
                TimeTrackingService.logTime({
                  issueId,
                  hours: Math.round(sessionHours * 1000) / 1000, // Round to 0.001h precision
                  description: 'Automatic time tracking session',
                  date: new Date().toISOString(),
                }).then(() => {
                  console.log(`📝 Time logged successfully for issue ${issueId}`);
                }).catch((error) => {
                  console.error(`❌ Failed to log time for issue ${issueId}:`, error);
                });
              } else {
                console.log(`⏭️ Session too short for issue ${issueId}, not logging (${sessionHours} hours < 0.001h threshold)`);
              }

              // Reset timer for potential future sessions (don't delete)
              existingTimer.totalElapsed = 0;
              existingTimer.status = 'completed';
            }
            break;
        }

        // Save to localStorage after any timer changes
        saveTimersToStorage(context.activeTimers);
        return { activeTimers: context.activeTimers };
      }),

      updateTimers: assign(({ context }) => {
        // Update elapsed time for running timers
        const now = Date.now();
        let hasRunningTimers = false;
        for (const timer of context.activeTimers.values()) {
          if (timer.status === 'running' && timer.startTime) {
            timer.totalElapsed = timer.totalElapsed + (now - timer.startTime);
            timer.startTime = now; // Reset start time for next tick
            hasRunningTimers = true;
          }
        }
        // Only save to localStorage every 10 seconds if there are running timers (reduce storage calls)
        if (hasRunningTimers && now % 10000 < 1000) {
          saveTimersToStorage(context.activeTimers);
        }
        return { activeTimers: context.activeTimers };
      }),

      forceStopTimer: assign(({ context, event }) => {
        const { issueId } = event;
        const timer = context.activeTimers.get(issueId);
        if (timer) {
          // Complete and log time
          if (timer.status === 'running' && timer.startTime) {
            timer.totalElapsed += Date.now() - timer.startTime;
          }

          const sessionHours = timer.totalElapsed / (1000 * 60 * 60);
          if (sessionHours >= 0.001) {
            TimeTrackingService.logTime({
              issueId,
              hours: Math.round(sessionHours * 1000) / 1000,
              description: 'Manual stop - automatic time tracking',
              date: new Date().toISOString(),
            }).catch(console.error);
          }

          // Reset timer but don't delete (keep for future sessions)
          timer.totalElapsed = 0;
          timer.status = 'completed';
          timer.startTime = null;
        }
        // Save to localStorage after force stop
        saveTimersToStorage(context.activeTimers);
        return { activeTimers: context.activeTimers };
      }),
    },
  }
);

// Helper function to get timer progress for UI
export const getTimerProgress = (
  elapsed: number, // in milliseconds
  estimate: number // in hours
): {
  percentage: number;
  color: 'green' | 'yellow' | 'red';
  elapsedHours: number;
  remainingHours: number;
} => {
  const elapsedHours = elapsed / (1000 * 60 * 60);
  const percentage = estimate > 0 ? (elapsedHours / estimate) * 100 : 0;

  let color: 'green' | 'yellow' | 'red' = 'green';
  if (percentage > 110) color = 'red';
  else if (percentage > 90) color = 'yellow';

  return {
    percentage: Math.min(percentage, 100),
    color,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    remainingHours: Math.max(0, estimate - elapsedHours),
  };
};