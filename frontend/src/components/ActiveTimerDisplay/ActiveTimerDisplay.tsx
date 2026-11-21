/**
 * Active Timer Display
 *
 * The strip above the header while any timer is running or paused. The timers live on the server, so one started
 * by an agent over MCP shows up here too, and pausing or stopping here is seen by the agent.
 */

import React, { useState } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { useActiveTimerDisplay, useTimerManager } from '../../hooks/useTimerManager';
import { TimerErrorBoundary } from '../ErrorBoundary';

const control = 'inline-flex min-h-8 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-800 hover:bg-gray-200';

const ActiveTimerDisplayInner: React.FC = () => {
  const display = useActiveTimerDisplay();
  const { pauseTimer, resumeTimer, stopTimer } = useTimerManager();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!display) return null;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); } catch (error) { console.error('Timer action failed:', error); } finally { setBusy(false); }
  };

  const rows = open ? display.rows : display.rows.slice(0, 1);

  return (
    <div className="border-b border-gray-200 bg-gray-100 text-sm text-gray-700" role="status" data-testid="active-timer">
      {rows.map(row => (
        <div key={row.issueId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5" data-testid={`timer-row-${row.issueId}`}>
          <span className={`size-2 rounded-full ${row.isRunning ? 'animate-pulse bg-blue-600' : 'bg-gray-400'}`} aria-hidden="true" />
          <span className="font-mono text-base font-semibold tabular-nums text-gray-900">{row.elapsedTime}</span>
          <span className="text-gray-600">{row.projectKey ? `${row.projectKey}-${row.issueId}` : `#${row.issueId}`}</span>
          {row.title && <span className="hidden max-w-[24rem] truncate text-gray-500 md:inline">{row.title}</span>}
          {!row.isRunning && <span className="text-xs text-gray-500">Paused</span>}
          {rows[0] === row && display.totalActiveTimers > 1 && (
            <button type="button" onClick={() => setOpen(o => !o)} className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-900" aria-expanded={open} data-testid="timer-more">
              {open ? 'Show less' : `+${display.totalActiveTimers - 1} more`}
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            {row.isRunning ? (
              <button type="button" disabled={busy} onClick={() => run(() => pauseTimer(row.issueId))} className={control} title="Pause the timer, keeping the time so far">
                <Pause className="size-3" strokeWidth={1.5} aria-hidden="true" /> Pause
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => run(() => resumeTimer(row.issueId))} className={control} title="Resume the timer">
                <Play className="size-3" strokeWidth={1.5} aria-hidden="true" /> Resume
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => run(() => stopTimer(row.issueId))} className={control} title="Stop the timer and log the time">
              <Square className="size-3 fill-current" strokeWidth={1.5} aria-hidden="true" /> Stop
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ActiveTimerDisplay: React.FC = () => {
  return (
    <TimerErrorBoundary>
      <ActiveTimerDisplayInner />
    </TimerErrorBoundary>
  );
};
