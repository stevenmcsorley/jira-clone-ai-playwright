/**
 * Enhanced Effect.ts API Service
 *
 * Production-ready API service with all features from the task requirements
 */

import { Effect, pipe } from 'effect';
import * as Schema from 'effect/Schema';
import type { ApiError } from '../../lib/effect-config';
import {
  NetworkError,
  ValidationError,
  ServerError,
  AuthenticationError,
  ConflictError,
  createRetryPolicy
} from '../../lib/effect-config';

// Configuration
const API_BASE_URL = '/api';

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request Configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: {
    key: string;
    ttl: number;
  };
  retry?: {
    attempts: number;
    delay: number;
  };
}

// Core API Request Function
export const apiRequest = <T>(
  config: RequestConfig,
  schema: Schema.Schema<T, any, never>
): Effect.Effect<T, ApiError, never> =>
  Effect.gen(function* () {
    const fullUrl = `${API_BASE_URL}${config.url}`;

    const requestInit: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
      ...(config.body ? { body: JSON.stringify(config.body) } : {}),
    };

    // Make the fetch request
    const response = yield* Effect.tryPromise({
      try: () => fetch(fullUrl, requestInit),
      catch: (error) => new NetworkError({
        message: `Network request failed: ${String(error)}`
      })
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = yield* Effect.tryPromise({
        try: () => response.text(),
        catch: () => 'Unknown error'
      });

      if (response.status === 401 || response.status === 403) {
        return yield* Effect.fail(new AuthenticationError({
          message: `Authentication failed: ${errorText}`
        }));
      }

      if (response.status === 409) {
        return yield* Effect.fail(new ConflictError({
          message: `Conflict: ${errorText}`
        }));
      }

      if (response.status >= 500) {
        return yield* Effect.fail(new ServerError({
          message: `Server error: ${errorText}`,
          status: response.status
        }));
      }

      return yield* Effect.fail(new NetworkError({
        message: `HTTP ${response.status}: ${errorText}`,
        status: response.status
      }));
    }

    // Parse response
    const responseText = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (error) => new NetworkError({
        message: `Failed to read response: ${String(error)}`
      })
    });

    // Handle empty responses
    if (!responseText.trim()) {
      // For DELETE requests or other operations that return no content
      if (config.method === 'DELETE') {
        return undefined as T;
      }
      return {} as T;
    }

    // Parse JSON
    const jsonData = yield* Effect.try({
      try: () => JSON.parse(responseText),
      catch: (error) => new ValidationError({
        message: 'Invalid JSON response',
        errors: [String(error)]
      })
    });

    // Validate with schema
    return yield* Schema.decodeUnknown(schema)(jsonData).pipe(
      Effect.mapError((error) => new ValidationError({
        message: 'Response validation failed',
        errors: [String(error)]
      }))
    );
  }).pipe(
    // Apply retry policy
    config.retry
      ? createRetryPolicy(config.retry.attempts, config.retry.delay)
      : createRetryPolicy(3, 1000)
  );

// Convenience functions
export const get = <T>(
  url: string,
  schema: Schema.Schema<T, any, never>,
  options?: { cache?: { key: string; ttl: number } }
) =>
  apiRequest(
    {
      method: 'GET',
      url,
      ...options
    },
    schema
  );

export const post = <T>(
  url: string,
  body: unknown,
  schema: Schema.Schema<T, any, never>
) =>
  apiRequest(
    { method: 'POST', url, body },
    schema
  );

export const patch = <T>(
  url: string,
  body: unknown,
  schema: Schema.Schema<T, any, never>
) =>
  apiRequest(
    { method: 'PATCH', url, body },
    schema
  );

export const put = <T>(
  url: string,
  body: unknown,
  schema: Schema.Schema<T, any, never>
) =>
  apiRequest(
    { method: 'PUT', url, body },
    schema
  );

export const del = <T>(
  url: string,
  schema: Schema.Schema<T, any, never>
) =>
  apiRequest(
    { method: 'DELETE', url },
    schema
  );

// Optimistic Update Support
export interface OptimisticOperation<T> {
  optimisticValue: T;
  actualOperation: Effect.Effect<T, ApiError, never>;
  onRollback?: (error: ApiError, optimisticValue: T) => void;
  onSuccess?: (actualValue: T, optimisticValue: T) => void;
}

export const withOptimisticUpdate = <T>(
  config: OptimisticOperation<T>
): Effect.Effect<T, ApiError, never> => {
  const { optimisticValue, actualOperation, onRollback, onSuccess } = config;

  // Return optimistic value immediately
  const optimistic = Effect.succeed(optimisticValue);

  // Run actual operation in background
  Effect.runFork(
    actualOperation.pipe(
      Effect.tap((actualValue) =>
        Effect.sync(() => onSuccess?.(actualValue, optimisticValue))
      ),
      Effect.tapError((error) =>
        Effect.sync(() => onRollback?.(error, optimisticValue))
      )
    )
  );

  return optimistic;
};

// Batch Operations Support
export const batchRequests = <T>(
  requests: Effect.Effect<T, ApiError, never>[]
): Effect.Effect<T[], ApiError, never> =>
  Effect.all(requests, {
    concurrency: 'unbounded',
    batching: 'inherit'
  });

// Cached Request (simple in-memory cache)
const cache = new Map<string, { data: any; expires: number }>();

export const cachedRequest = <T>(
  cacheKey: string,
  ttl: number,
  request: Effect.Effect<T, ApiError, never>
): Effect.Effect<T, ApiError, never> =>
  Effect.gen(function* () {
    const now = Date.now();
    const cached = cache.get(cacheKey);

    if (cached && cached.expires > now) {
      return cached.data as T;
    }

    const result = yield* request;
    cache.set(cacheKey, { data: result, expires: now + ttl });
    return result;
  });

// Queue operations for offline support
interface QueuedOperation {
  id: string;
  operation: Effect.Effect<any, ApiError, never>;
  timestamp: number;
  retryCount: number;
}

const operationQueue: QueuedOperation[] = [];

export const queueOperation = (
  operation: Effect.Effect<any, ApiError, never>,
  maxRetries: number = 3
): string => {
  const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  operationQueue.push({
    id,
    operation,
    timestamp: Date.now(),
    retryCount: 0
  });
  return id;
};

export const processQueue = (): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    const pendingOps = operationQueue.splice(0);

    for (const op of pendingOps) {
      yield* Effect.fork(
        op.operation.pipe(
          Effect.tapError((error) =>
            Effect.sync(() => {
              if (op.retryCount < 3) {
                op.retryCount++;
                operationQueue.push(op);
              } else {
                console.error(`Operation ${op.id} failed after max retries:`, error);
              }
            })
          )
        )
      );
    }
  });

// Development helpers
export const logRequest = <T>(
  label: string,
  effect: Effect.Effect<T, ApiError, never>
): Effect.Effect<T, ApiError, never> =>
  Effect.tap(effect, (value) =>
    Effect.sync(() => console.log(`[API ${label}] Success:`, value))
  ).pipe(
    Effect.tapError((error) =>
      Effect.sync(() => console.error(`[API ${label}] Error:`, error))
    )
  );