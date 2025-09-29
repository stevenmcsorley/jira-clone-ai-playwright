/**
 * Estimation Effect.ts React Hooks
 *
 * Enhanced hooks for Planning Poker estimation with optimistic updates and real-time collaboration
 */

import { useMemo, useCallback } from 'react';
import { Effect } from 'effect';
import { useEffectHook, useAsyncEffect, useOptimisticUpdate } from './useEffect';
import type { ApiError } from '../../lib/effect-config';

// Types
interface EstimationSession {
  id: number;
  name: string;
  description?: string;
  status: 'created' | 'waiting' | 'voting' | 'discussing' | 'completed';
  estimationScale: 'fibonacci' | 'tshirt' | 'hours' | 'power_of_2';
  anonymousVoting: boolean;
  discussionTimeLimit: number;
  autoReveal: boolean;
  currentIssueId?: number;
  facilitatorId: number;
  projectId: number;
  sprintId?: number;
  participants: EstimationParticipant[];
  sessionIssues: SessionIssue[];
  createdAt: string;
  updatedAt: string;
}

interface EstimationParticipant {
  id: number;
  userId: number;
  user: { id: number; name: string; email: string };
  status: 'invited' | 'joined' | 'voting' | 'voted' | 'left';
  isOnline: boolean;
  lastSeenAt?: string;
}

interface SessionIssue {
  id: number;
  issueId: number;
  issue: { id: number; title: string; description?: string; type: string; priority: string };
  status: 'pending' | 'voting' | 'discussing' | 'estimated' | 'skipped';
  position: number;
  finalEstimate?: number;
  hasConsensus: boolean;
  votingRound: number;
  discussionNotes?: string;
  votes: EstimationVote[];
}

interface EstimationVote {
  id: number;
  voterId: number;
  voter: { id: number; name: string };
  estimate: number;
  estimateText: string;
  rationale?: string;
  round: number;
  isRevealed: boolean;
}

interface CreateSessionRequest {
  name: string;
  description?: string;
  projectId: number;
  sprintId?: number;
  facilitatorId: number;
  estimationScale?: 'fibonacci' | 'tshirt' | 'hours' | 'power_of_2';
  anonymousVoting?: boolean;
  discussionTimeLimit?: number;
  autoReveal?: boolean;
  issueIds: number[];
}

interface VoteRequest {
  estimate: number;
  estimateText: string;
  rationale?: string;
}

/**
 * Hook for fetching estimation sessions by project
 */
export const useEstimationSessionsEffect = (projectId?: number) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed([]);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions?projectId=${projectId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch sessions: ${String(error)}`)
    }) as Effect.Effect<EstimationSession[], ApiError, never>;
  }, [projectId]);

  const {
    data: sessions,
    loading,
    error,
    refetch
  } = useEffectHook<EstimationSession[]>(fetchEffect, {
    initialData: [],
    dependencies: [projectId],
    immediate: projectId !== undefined
  });

  return {
    sessions: sessions || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching a specific estimation session
 */
export const useEstimationSessionEffect = (sessionId?: number) => {
  const fetchEffect = useMemo(() => {
    if (sessionId === undefined) {
      return Effect.succeed(null);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch session: ${String(error)}`)
    }) as Effect.Effect<EstimationSession | null, ApiError, never>;
  }, [sessionId]);

  const {
    data: session,
    loading,
    error,
    refetch
  } = useEffectHook<EstimationSession | null>(fetchEffect, {
    initialData: null,
    dependencies: [sessionId],
    immediate: sessionId !== undefined
  });

  return {
    session,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for creating estimation sessions with optimistic updates
 */
export const useCreateEstimationSessionEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<EstimationSession>();

  const createSession = useCallback(async (sessionData: CreateSessionRequest): Promise<EstimationSession> => {
    // Create optimistic session
    const optimisticSession: EstimationSession = {
      id: Date.now(), // Temporary ID
      name: sessionData.name,
      description: sessionData.description,
      status: 'created',
      estimationScale: sessionData.estimationScale || 'fibonacci',
      anonymousVoting: sessionData.anonymousVoting || false,
      discussionTimeLimit: sessionData.discussionTimeLimit || 120,
      autoReveal: sessionData.autoReveal || true,
      facilitatorId: sessionData.facilitatorId,
      projectId: sessionData.projectId,
      sprintId: sessionData.sprintId,
      participants: [],
      sessionIssues: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch('/api/estimation/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Create session failed: ${String(error)}`)
    }) as Effect.Effect<EstimationSession, ApiError, never>;

    return performOptimisticUpdate(
      optimisticSession,
      createEffect,
      (error) => {
        console.error('Failed to create estimation session, rolling back:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    createSession,
    optimisticSession: optimisticData,
    isOptimistic
  };
};

/**
 * Hook for joining estimation sessions
 */
export const useJoinEstimationSessionEffect = () => {
  const joinSession = useCallback(async (sessionId: number, userId: number): Promise<EstimationParticipant> => {
    const joinEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      },
      catch: (error) => new Error(`Join session failed: ${String(error)}`)
    }) as Effect.Effect<EstimationParticipant, ApiError, never>;

    return Effect.runPromise(joinEffect);
  }, []);

  return {
    joinSession
  };
};

/**
 * Hook for session control operations (facilitator only)
 */
export const useEstimationSessionControlEffect = () => {
  // Start session
  const startSession = useCallback(async (sessionId: number, facilitatorId: number): Promise<EstimationSession> => {
    const startEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilitatorId })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Start session failed: ${String(error)}`)
    }) as Effect.Effect<EstimationSession, ApiError, never>;

    return Effect.runPromise(startEffect);
  }, []);

  // Start voting
  const startVoting = useCallback(async (sessionId: number, facilitatorId: number): Promise<SessionIssue> => {
    const votingEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/start-voting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilitatorId })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Start voting failed: ${String(error)}`)
    }) as Effect.Effect<SessionIssue, ApiError, never>;

    return Effect.runPromise(votingEffect);
  }, []);

  // Reveal votes
  const revealVotes = useCallback(async (
    sessionId: number,
    issueId: number,
    facilitatorId: number
  ): Promise<EstimationVote[]> => {
    const revealEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/issues/${issueId}/reveal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilitatorId })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Reveal votes failed: ${String(error)}`)
    }) as Effect.Effect<EstimationVote[], ApiError, never>;

    return Effect.runPromise(revealEffect);
  }, []);

  // Move to next issue
  const moveToNextIssue = useCallback(async (sessionId: number, facilitatorId: number): Promise<SessionIssue | null> => {
    const moveEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/next-issue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilitatorId })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Move to next issue failed: ${String(error)}`)
    }) as Effect.Effect<SessionIssue | null, ApiError, never>;

    return Effect.runPromise(moveEffect);
  }, []);

  // Finalize estimate
  const finalizeEstimate = useCallback(async (
    sessionId: number,
    issueId: number,
    facilitatorId: number,
    finalEstimate: number
  ): Promise<SessionIssue> => {
    const finalizeEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/issues/${issueId}/finalize`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilitatorId, finalEstimate })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Finalize estimate failed: ${String(error)}`)
    }) as Effect.Effect<SessionIssue, ApiError, never>;

    return Effect.runPromise(finalizeEffect);
  }, []);

  return {
    startSession,
    startVoting,
    revealVotes,
    moveToNextIssue,
    finalizeEstimate
  };
};

/**
 * Hook for voting operations with optimistic updates
 */
export const useEstimationVotingEffect = () => {
  const { optimisticData, isOptimistic, performOptimisticUpdate } = useOptimisticUpdate<EstimationVote>();

  const submitVote = useCallback(async (
    sessionId: number,
    issueId: number,
    voterId: number,
    voteData: VoteRequest
  ): Promise<EstimationVote> => {
    // Create optimistic vote
    const optimisticVote: EstimationVote = {
      id: Date.now(), // Temporary ID
      voterId,
      voter: { id: voterId, name: 'You' }, // Will be updated with real data
      estimate: voteData.estimate,
      estimateText: voteData.estimateText,
      rationale: voteData.rationale,
      round: 1, // This should come from current session state
      isRevealed: false
    };

    const voteEffect = Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}/issues/${issueId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voterId,
            vote: voteData
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Submit vote failed: ${String(error)}`)
    }) as Effect.Effect<EstimationVote, ApiError, never>;

    return performOptimisticUpdate(
      optimisticVote,
      voteEffect,
      (error) => {
        console.error('Failed to submit vote, rolling back:', error);
      }
    );
  }, [performOptimisticUpdate]);

  return {
    submitVote,
    optimisticVote: optimisticData,
    isOptimistic
  };
};

/**
 * Hook for getting estimation scales
 */
export const useEstimationScalesEffect = () => {
  const fetchEffect = useMemo(() => {
    return Effect.tryPromise({
      try: async () => {
        const response = await fetch('/api/estimation/scales');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch scales: ${String(error)}`)
    }) as Effect.Effect<Record<string, string[]>, ApiError, never>;
  }, []);

  const {
    data: scales,
    loading,
    error,
    refetch
  } = useEffectHook<Record<string, string[]>>(fetchEffect, {
    initialData: {},
    immediate: true
  });

  return {
    scales: scales || {},
    loading,
    error,
    refetch
  };
};

/**
 * Hook for real-time estimation updates using WebSocket or polling
 */
export const useEstimationRealTimeEffect = (sessionId: number) => {
  // This would be implemented with WebSocket connections for real-time updates
  // For now, we'll use polling as a fallback

  const { execute: pollUpdates, ...state } = useAsyncEffect((sessionId: number) =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/estimation/sessions/${sessionId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Real-time update failed: ${String(error)}`)
    }) as Effect.Effect<EstimationSession, ApiError, never>
  );

  // Simulated real-time updates - in production this would be WebSocket
  const startRealTimeUpdates = useCallback(() => {
    const interval = setInterval(() => {
      pollUpdates(sessionId);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [sessionId, pollUpdates]);

  return {
    ...state,
    startRealTimeUpdates,
    latestSession: state.data
  };
};