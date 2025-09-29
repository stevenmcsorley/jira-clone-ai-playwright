/**
 * Planning Poker Estimation State Machine
 *
 * Manages the complete flow of estimation sessions including session creation,
 * participant management, voting rounds, and consensus building.
 */

import { setup, assign, fromPromise } from 'xstate';

// Types
export interface EstimationSession {
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

export interface EstimationParticipant {
  id: number;
  userId: number;
  user: { id: number; name: string; email: string };
  status: 'invited' | 'joined' | 'voting' | 'voted' | 'left';
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface SessionIssue {
  id: number;
  issueId: number;
  issue: {
    id: number;
    title: string;
    description?: string;
    type: string;
    priority: string;
  };
  status: 'pending' | 'voting' | 'discussing' | 'estimated' | 'skipped';
  position: number;
  finalEstimate?: number;
  hasConsensus: boolean;
  votingRound: number;
  discussionNotes?: string;
  votes: EstimationVote[];
}

export interface EstimationVote {
  id: number;
  voterId: number;
  voter: { id: number; name: string };
  estimate: number;
  estimateText: string;
  rationale?: string;
  round: number;
  isRevealed: boolean;
}

export interface VoteStatistics {
  totalVotes: number;
  averageEstimate: number;
  minEstimate: number;
  maxEstimate: number;
  hasConsensus: boolean;
  votes: Array<{
    voter: string;
    estimate: number;
    estimateText: string;
    rationale?: string;
    isRevealed: boolean;
  }>;
}

// Context for the estimation machine
export interface EstimationContext {
  session?: EstimationSession;
  currentUserId?: number;
  currentIssue?: SessionIssue;
  selectedEstimate?: { estimate: number; estimateText: string };
  rationale?: string;
  voteStatistics?: VoteStatistics;
  discussionTimeRemaining?: number;
  error?: string;
  isLoading: boolean;

  // Real-time updates
  participantUpdates: EstimationParticipant[];
  voteUpdates: EstimationVote[];
  lastUpdate?: string;
}

// Events
export type EstimationEvents =
  | { type: 'LOAD_SESSION'; sessionId: number; userId: number }
  | { type: 'SESSION_LOADED'; session: EstimationSession }
  | { type: 'JOIN_SESSION'; userId: number }
  | { type: 'PARTICIPANT_JOINED'; participant: EstimationParticipant }
  | { type: 'START_SESSION' }
  | { type: 'SESSION_STARTED' }
  | { type: 'START_VOTING' }
  | { type: 'VOTING_STARTED'; issue: SessionIssue }
  | { type: 'SELECT_ESTIMATE'; estimate: number; estimateText: string }
  | { type: 'SET_RATIONALE'; rationale: string }
  | { type: 'SUBMIT_VOTE' }
  | { type: 'VOTE_SUBMITTED'; vote: EstimationVote }
  | { type: 'PARTICIPANT_VOTED'; participantId: number }
  | { type: 'REVEAL_VOTES' }
  | { type: 'VOTES_REVEALED'; votes: EstimationVote[]; statistics: VoteStatistics }
  | { type: 'START_DISCUSSION' }
  | { type: 'DISCUSSION_TIMER_TICK'; timeRemaining: number }
  | { type: 'FINALIZE_ESTIMATE'; finalEstimate: number }
  | { type: 'ESTIMATE_FINALIZED'; sessionIssue: SessionIssue }
  | { type: 'START_NEW_ROUND' }
  | { type: 'NEW_ROUND_STARTED'; sessionIssue: SessionIssue }
  | { type: 'MOVE_TO_NEXT_ISSUE' }
  | { type: 'NEXT_ISSUE_LOADED'; sessionIssue?: SessionIssue }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'SESSION_COMPLETED' }
  | { type: 'PARTICIPANT_UPDATE'; participant: EstimationParticipant }
  | { type: 'REAL_TIME_UPDATE'; data: any }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Machine setup
export const estimationMachine = setup({
  types: {
    context: {} as EstimationContext,
    events: {} as EstimationEvents,
    input: {} as { sessionId: number; userId: number; apiBaseUrl?: string },
  },

  guards: {
    isFacilitator: ({ context }) =>
      context.session?.facilitatorId === context.currentUserId,
    hasSelectedEstimate: ({ context }) =>
      !!context.selectedEstimate,
    allParticipantsVoted: ({ context }) => {
      if (!context.session || !context.currentIssue) return false;

      const activeParticipants = context.session.participants.filter(p =>
        p.status === 'joined' && p.isOnline
      );

      const votesThisRound = context.currentIssue.votes.filter(v =>
        v.round === context.currentIssue!.votingRound
      );

      return votesThisRound.length >= activeParticipants.length;
    },
    hasConsensus: ({ context }) =>
      context.voteStatistics?.hasConsensus ?? false,
    hasNextIssue: ({ context }) => {
      if (!context.session || !context.currentIssue) return false;

      const currentIndex = context.session.sessionIssues.findIndex(si =>
        si.issueId === context.currentIssue!.issueId
      );

      return currentIndex < context.session.sessionIssues.length - 1;
    },
    canStartVoting: ({ context }) =>
      context.session?.status === 'waiting' && !!context.session.currentIssueId,
    canRevealVotes: ({ context }) =>
      context.session?.status === 'voting' ||
      (context.session?.autoReveal && context.allParticipantsVoted),
  },

  actions: {
    // Session loading actions
    setLoading: assign({ isLoading: true }),
    clearLoading: assign({ isLoading: false }),

    setSession: assign({
      session: ({ event }, params: { session: EstimationSession }) => params.session,
      currentIssue: ({ event }, params: { session: EstimationSession }) => {
        if (!params.session.currentIssueId) return undefined;
        return params.session.sessionIssues.find(si =>
          si.issueId === params.session.currentIssueId
        );
      },
    }),

    setCurrentUser: assign({
      currentUserId: ({ event }, params: { userId: number }) => params.userId,
    }),

    // Participant actions
    addParticipant: assign({
      session: ({ context }, params: { participant: EstimationParticipant }) => {
        if (!context.session) return context.session;

        const existingIndex = context.session.participants.findIndex(p =>
          p.userId === params.participant.userId
        );

        if (existingIndex >= 0) {
          const updatedParticipants = [...context.session.participants];
          updatedParticipants[existingIndex] = params.participant;

          return {
            ...context.session,
            participants: updatedParticipants,
          };
        }

        return {
          ...context.session,
          participants: [...context.session.participants, params.participant],
        };
      },
    }),

    updateParticipantStatus: assign({
      session: ({ context }, params: { participantId: number; status: string }) => {
        if (!context.session) return context.session;

        const updatedParticipants = context.session.participants.map(p =>
          p.userId === params.participantId
            ? { ...p, status: params.status as any }
            : p
        );

        return {
          ...context.session,
          participants: updatedParticipants,
        };
      },
    }),

    // Voting actions
    setSelectedEstimate: assign({
      selectedEstimate: ({ event }, params: { estimate: number; estimateText: string }) => ({
        estimate: params.estimate,
        estimateText: params.estimateText,
      }),
    }),

    setRationale: assign({
      rationale: ({ event }, params: { rationale: string }) => params.rationale,
    }),

    clearVoteSelection: assign({
      selectedEstimate: undefined,
      rationale: undefined,
    }),

    addVote: assign({
      currentIssue: ({ context }, params: { vote: EstimationVote }) => {
        if (!context.currentIssue) return context.currentIssue;

        // Remove existing vote from same voter for same round
        const filteredVotes = context.currentIssue.votes.filter(v =>
          !(v.voterId === params.vote.voterId && v.round === params.vote.round)
        );

        return {
          ...context.currentIssue,
          votes: [...filteredVotes, params.vote],
        };
      },
    }),

    // Vote reveal actions
    revealVotes: assign({
      currentIssue: ({ context }, params: { votes: EstimationVote[] }) => {
        if (!context.currentIssue) return context.currentIssue;

        return {
          ...context.currentIssue,
          votes: params.votes,
        };
      },
      voteStatistics: ({ event }, params: { statistics: VoteStatistics }) => params.statistics,
    }),

    // Session progression actions
    updateSessionStatus: assign({
      session: ({ context }, params: { status: string }) => {
        if (!context.session) return context.session;

        return {
          ...context.session,
          status: params.status as any,
        };
      },
    }),

    updateCurrentIssue: assign({
      currentIssue: ({ event }, params: { sessionIssue: SessionIssue }) => params.sessionIssue,
      session: ({ context }, params: { sessionIssue: SessionIssue }) => {
        if (!context.session) return context.session;

        const updatedSessionIssues = context.session.sessionIssues.map(si =>
          si.id === params.sessionIssue.id ? params.sessionIssue : si
        );

        return {
          ...context.session,
          sessionIssues: updatedSessionIssues,
          currentIssueId: params.sessionIssue.issueId,
        };
      },
    }),

    moveToNextIssue: assign({
      currentIssue: ({ event }, params: { sessionIssue?: SessionIssue }) => params.sessionIssue,
      session: ({ context }, params: { sessionIssue?: SessionIssue }) => {
        if (!context.session) return context.session;

        return {
          ...context.session,
          currentIssueId: params.sessionIssue?.issueId || null,
          status: params.sessionIssue ? 'waiting' : 'completed',
        };
      },
      voteStatistics: undefined,
      selectedEstimate: undefined,
      rationale: undefined,
    }),

    // Timer actions
    startDiscussionTimer: assign({
      discussionTimeRemaining: ({ context }) => context.session?.discussionTimeLimit || 120,
    }),

    updateDiscussionTimer: assign({
      discussionTimeRemaining: ({ event }, params: { timeRemaining: number }) => params.timeRemaining,
    }),

    // Error handling
    setError: assign({
      error: ({ event }, params: { error: string }) => params.error,
      isLoading: false,
    }),

    clearError: assign({
      error: undefined,
    }),

    // Real-time update handling
    handleRealTimeUpdate: assign({
      // This would be implemented based on the specific real-time update structure
      lastUpdate: () => new Date().toISOString(),
    }),
  },

  actors: {
    // Load session data
    loadSession: fromPromise(async ({ input }: { input: { sessionId: number } }) => {
      const response = await fetch(`/api/estimation/sessions/${input.sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');
      return response.json();
    }),

    // Join session
    joinSession: fromPromise(async ({ input }: { input: { sessionId: number; userId: number } }) => {
      const response = await fetch(`/api/estimation/sessions/${input.sessionId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: input.userId }),
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    }),

    // Start session
    startSession: fromPromise(async ({ input }: { input: { sessionId: number; facilitatorId: number } }) => {
      const response = await fetch(`/api/estimation/sessions/${input.sessionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilitatorId: input.facilitatorId }),
      });
      if (!response.ok) throw new Error('Failed to start session');
      return response.json();
    }),

    // Start voting
    startVoting: fromPromise(async ({ input }: { input: { sessionId: number; facilitatorId: number } }) => {
      const response = await fetch(`/api/estimation/sessions/${input.sessionId}/start-voting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilitatorId: input.facilitatorId }),
      });
      if (!response.ok) throw new Error('Failed to start voting');
      return response.json();
    }),

    // Submit vote
    submitVote: fromPromise(async ({ input }: {
      input: {
        sessionId: number;
        issueId: number;
        voterId: number;
        vote: { estimate: number; estimateText: string; rationale?: string }
      }
    }) => {
      const response = await fetch(`/api/estimation/sessions/${input.sessionId}/issues/${input.issueId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: input.voterId,
          vote: input.vote
        }),
      });
      if (!response.ok) throw new Error('Failed to submit vote');
      return response.json();
    }),

    // Reveal votes
    revealVotes: fromPromise(async ({ input }: {
      input: { sessionId: number; issueId: number; facilitatorId: number }
    }) => {
      const response = await fetch(`/api/estimation/sessions/${input.sessionId}/issues/${input.issueId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilitatorId: input.facilitatorId }),
      });
      if (!response.ok) throw new Error('Failed to reveal votes');
      return response.json();
    }),

    // Discussion timer
    discussionTimer: fromPromise(async ({ input }: { input: { duration: number } }) => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, input.duration * 1000);
      });
    }),
  },
}).createMachine({
  id: 'estimation',
  initial: 'loading',

  context: ({ input }) => ({
    currentUserId: input.userId,
    isLoading: false,
    participantUpdates: [],
    voteUpdates: [],
  }),

  states: {
    loading: {
      entry: 'setLoading',
      invoke: {
        src: 'loadSession',
        input: ({ input }) => ({ sessionId: input.sessionId }),
        onDone: {
          target: 'loaded',
          actions: [
            'clearLoading',
            { type: 'setSession', params: ({ event }) => ({ session: event.output }) },
          ],
        },
        onError: {
          target: 'error',
          actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
        },
      },
    },

    loaded: {
      initial: 'determining_state',
      states: {
        determining_state: {
          always: [
            {
              guard: ({ context }) => context.session?.status === 'created',
              target: 'created',
            },
            {
              guard: ({ context }) => context.session?.status === 'waiting',
              target: 'waiting',
            },
            {
              guard: ({ context }) => context.session?.status === 'voting',
              target: 'voting',
            },
            {
              guard: ({ context }) => context.session?.status === 'discussing',
              target: 'discussing',
            },
            {
              guard: ({ context }) => context.session?.status === 'completed',
              target: 'completed',
            },
            {
              target: 'created', // Default fallback
            },
          ],
        },

        created: {
          on: {
            JOIN_SESSION: {
              actions: 'setLoading',
              invoke: {
                src: 'joinSession',
                input: ({ context, input }) => ({
                  sessionId: input.sessionId,
                  userId: context.currentUserId!
                }),
                onDone: {
                  actions: [
                    'clearLoading',
                    { type: 'addParticipant', params: ({ event }) => ({ participant: event.output }) },
                  ],
                },
                onError: {
                  target: '#estimation.error',
                  actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
                },
              },
            },
            START_SESSION: [
              {
                guard: 'isFacilitator',
                actions: 'setLoading',
                invoke: {
                  src: 'startSession',
                  input: ({ context, input }) => ({
                    sessionId: input.sessionId,
                    facilitatorId: context.currentUserId!
                  }),
                  onDone: {
                    target: 'waiting',
                    actions: [
                      'clearLoading',
                      { type: 'updateSessionStatus', params: { status: 'waiting' } },
                    ],
                  },
                  onError: {
                    target: '#estimation.error',
                    actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
                  },
                },
              },
            ],
          },
        },

        waiting: {
          on: {
            START_VOTING: [
              {
                guard: ['isFacilitator', 'canStartVoting'],
                actions: 'setLoading',
                invoke: {
                  src: 'startVoting',
                  input: ({ context, input }) => ({
                    sessionId: input.sessionId,
                    facilitatorId: context.currentUserId!
                  }),
                  onDone: {
                    target: 'voting',
                    actions: [
                      'clearLoading',
                      { type: 'updateCurrentIssue', params: ({ event }) => ({ sessionIssue: event.output }) },
                    ],
                  },
                  onError: {
                    target: '#estimation.error',
                    actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
                  },
                },
              },
            ],
          },
        },

        voting: {
          initial: 'selecting',

          states: {
            selecting: {
              on: {
                SELECT_ESTIMATE: {
                  actions: {
                    type: 'setSelectedEstimate',
                    params: ({ event }) => ({
                      estimate: event.estimate,
                      estimateText: event.estimateText
                    })
                  },
                },
                SET_RATIONALE: {
                  actions: {
                    type: 'setRationale',
                    params: ({ event }) => ({ rationale: event.rationale })
                  },
                },
                SUBMIT_VOTE: [
                  {
                    guard: 'hasSelectedEstimate',
                    target: 'submitting',
                  },
                ],
              },
            },

            submitting: {
              entry: 'setLoading',
              invoke: {
                src: 'submitVote',
                input: ({ context, input }) => ({
                  sessionId: input.sessionId,
                  issueId: context.currentIssue!.issueId,
                  voterId: context.currentUserId!,
                  vote: {
                    estimate: context.selectedEstimate!.estimate,
                    estimateText: context.selectedEstimate!.estimateText,
                    rationale: context.rationale,
                  },
                }),
                onDone: {
                  target: 'voted',
                  actions: [
                    'clearLoading',
                    'clearVoteSelection',
                    { type: 'addVote', params: ({ event }) => ({ vote: event.output }) },
                    {
                      type: 'updateParticipantStatus',
                      params: ({ context }) => ({
                        participantId: context.currentUserId!,
                        status: 'voted'
                      })
                    },
                  ],
                },
                onError: {
                  target: 'selecting',
                  actions: [
                    'clearLoading',
                    { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
                  ],
                },
              },
            },

            voted: {
              on: {
                SELECT_ESTIMATE: {
                  target: 'selecting',
                  actions: {
                    type: 'setSelectedEstimate',
                    params: ({ event }) => ({
                      estimate: event.estimate,
                      estimateText: event.estimateText
                    })
                  },
                },
              },
            },
          },

          on: {
            REVEAL_VOTES: [
              {
                guard: ['isFacilitator', 'canRevealVotes'],
                target: 'revealing',
              },
            ],
            PARTICIPANT_VOTED: {
              actions: {
                type: 'updateParticipantStatus',
                params: ({ event }) => ({
                  participantId: event.participantId,
                  status: 'voted'
                })
              },
            },
          },

          // Auto-reveal when all voted
          always: [
            {
              guard: ['allParticipantsVoted', ({ context }) => context.session?.autoReveal === true],
              target: 'revealing',
            },
          ],
        },

        revealing: {
          entry: 'setLoading',
          invoke: {
            src: 'revealVotes',
            input: ({ context, input }) => ({
              sessionId: input.sessionId,
              issueId: context.currentIssue!.issueId,
              facilitatorId: context.session!.facilitatorId,
            }),
            onDone: {
              target: 'discussing',
              actions: [
                'clearLoading',
                {
                  type: 'revealVotes',
                  params: ({ event }) => ({
                    votes: event.output.votes || event.output,
                    statistics: event.output.statistics || {},
                  })
                },
                'startDiscussionTimer',
              ],
            },
            onError: {
              target: '#estimation.error',
              actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
            },
          },
        },

        discussing: {
          entry: 'startDiscussionTimer',

          invoke: {
            src: 'discussionTimer',
            input: ({ context }) => ({ duration: context.session?.discussionTimeLimit || 120 }),
            onDone: {
              // Timer completed - could automatically move to next step
            },
          },

          on: {
            DISCUSSION_TIMER_TICK: {
              actions: {
                type: 'updateDiscussionTimer',
                params: ({ event }) => ({ timeRemaining: event.timeRemaining })
              },
            },

            FINALIZE_ESTIMATE: [
              {
                guard: 'isFacilitator',
                target: 'finalizing',
              },
            ],

            START_NEW_ROUND: [
              {
                guard: 'isFacilitator',
                target: 'voting',
                actions: [
                  'clearVoteSelection',
                  { type: 'updateCurrentIssue', params: ({ event }) => ({ sessionIssue: event.sessionIssue }) },
                ],
              },
            ],
          },
        },

        finalizing: {
          // Implementation for finalizing estimates
          on: {
            ESTIMATE_FINALIZED: {
              target: 'issue_completed',
              actions: {
                type: 'updateCurrentIssue',
                params: ({ event }) => ({ sessionIssue: event.sessionIssue })
              },
            },
          },
        },

        issue_completed: {
          on: {
            MOVE_TO_NEXT_ISSUE: [
              {
                guard: ['isFacilitator', 'hasNextIssue'],
                target: 'waiting',
                actions: {
                  type: 'moveToNextIssue',
                  params: ({ event }) => ({ sessionIssue: event.sessionIssue })
                },
              },
              {
                guard: 'isFacilitator',
                target: 'completed',
                actions: {
                  type: 'updateSessionStatus',
                  params: { status: 'completed' }
                },
              },
            ],
          },
        },

        completed: {
          type: 'final',
        },
      },

      on: {
        PARTICIPANT_JOINED: {
          actions: {
            type: 'addParticipant',
            params: ({ event }) => ({ participant: event.participant })
          },
        },
        PARTICIPANT_UPDATE: {
          actions: {
            type: 'addParticipant',
            params: ({ event }) => ({ participant: event.participant })
          },
        },
        REAL_TIME_UPDATE: {
          actions: 'handleRealTimeUpdate',
        },
      },
    },

    error: {
      on: {
        RETRY: {
          target: 'loading',
          actions: 'clearError',
        },
        RESET: {
          target: 'loading',
          actions: 'clearError',
        },
      },
    },
  },
});

// Helper function to create machine with input
export function createEstimationMachine(sessionId: number, userId: number) {
  return estimationMachine.provide({
    input: { sessionId, userId },
  });
}