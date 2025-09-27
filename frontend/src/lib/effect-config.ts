/**
 * Effect.ts Configuration and Runtime Setup
 *
 * This file contains the base configuration for Effect.ts runtime,
 * error handling, and service patterns used throughout the application.
 */

import { Effect, Layer, Context, Console } from 'effect';
import * as Schema from 'effect/Schema';

// Base configuration for API requests
export interface ApiConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

// Create a service for API configuration
export class ApiConfigService extends Context.Tag('ApiConfigService')<
  ApiConfigService,
  ApiConfig
>() {}

// Default API configuration
export const defaultApiConfig: ApiConfig = {
  baseUrl: '/api',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// Layer that provides the API configuration
export const ApiConfigLive = Layer.succeed(ApiConfigService, defaultApiConfig);

// Common error types used throughout the application
export class NetworkError extends Schema.TaggedError<NetworkError>()("NetworkError", {
  message: Schema.String,
  status: Schema.optional(Schema.Number),
}) {}

export class ValidationError extends Schema.TaggedError<ValidationError>()("ValidationError", {
  message: Schema.String,
  errors: Schema.Array(Schema.String),
}) {}

export class AuthenticationError extends Schema.TaggedError<AuthenticationError>()("AuthenticationError", {
  message: Schema.String,
}) {}

export class ServerError extends Schema.TaggedError<ServerError>()("ServerError", {
  message: Schema.String,
  status: Schema.Number,
}) {}

export class ConflictError extends Schema.TaggedError<ConflictError>()("ConflictError", {
  message: Schema.String,
  details: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
}) {}

// Union of all possible API errors
export type ApiError =
  | NetworkError
  | ValidationError
  | AuthenticationError
  | ServerError
  | ConflictError;

// Utility function to create a retry policy
export const createRetryPolicy = (maxAttempts: number, delay: number) =>
  Effect.retry({
    times: maxAttempts - 1,
    schedule: Effect.scheduleFixed(delay),
  });

// Base Effect for API operations with common error handling
export const withApiDefaults = <A, E>(
  effect: Effect.Effect<A, E, ApiConfigService>
): Effect.Effect<A, E | NetworkError, ApiConfigService> =>
  effect.pipe(
    Effect.timeout(10000), // 10 seconds timeout
    Effect.mapError((error) => {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        return new NetworkError({ message: String(error.message) });
      }
      return new NetworkError({ message: 'Unknown network error' });
    })
  );

// Utility to run Effects in React components (basic version)
export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, any>,
  options?: {
    onSuccess?: (value: A) => void;
    onError?: (error: E) => void;
    onStart?: () => void;
  }
) => {
  const { onSuccess, onError, onStart } = options || {};

  onStart?.();

  Effect.runPromise(effect)
    .then(onSuccess)
    .catch(onError);
};

// Development helpers
export const logEffect = <A, E, R>(
  label: string,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  Effect.tap(effect, (value) =>
    Console.log(`[${label}] Success:`, value)
  ).pipe(
    Effect.tapError((error) =>
      Console.error(`[${label}] Error:`, error)
    )
  );

// Utility for safe JSON parsing with Effect
export const parseJson = (jsonString: string) =>
  Effect.try({
    try: () => JSON.parse(jsonString),
    catch: (error) => new ValidationError({
      message: 'Invalid JSON',
      errors: [String(error)]
    })
  });

// Create a simple cache layer (for development)
interface CacheService {
  get: (key: string) => Effect.Effect<unknown, never, never>;
  set: (key: string, value: unknown, ttl?: number) => Effect.Effect<void, never, never>;
  delete: (key: string) => Effect.Effect<void, never, never>;
}

export class Cache extends Context.Tag('Cache')<Cache, CacheService>() {}

// Simple in-memory cache implementation
const createInMemoryCache = (): CacheService => {
  const cache = new Map<string, { value: unknown; expires?: number }>();

  return {
    get: (key: string) =>
      Effect.sync(() => {
        const item = cache.get(key);
        if (!item) return undefined;
        if (item.expires && Date.now() > item.expires) {
          cache.delete(key);
          return undefined;
        }
        return item.value;
      }),

    set: (key: string, value: unknown, ttl?: number) =>
      Effect.sync(() => {
        const expires = ttl ? Date.now() + ttl : undefined;
        cache.set(key, { value, expires });
      }),

    delete: (key: string) =>
      Effect.sync(() => {
        cache.delete(key);
      })
  };
};

export const CacheLive = Layer.sync(Cache, createInMemoryCache);