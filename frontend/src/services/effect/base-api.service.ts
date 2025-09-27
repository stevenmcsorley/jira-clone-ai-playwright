/**
 * Base API Service with Effect.ts
 *
 * This service provides the foundation for all API operations using Effect.ts.
 * It includes automatic retry logic, error handling, caching, and optimistic updates.
 */

import { Effect, Context, pipe, Layer } from 'effect';
import * as Schema from 'effect/Schema';
import type { ApiError } from '../../lib/effect-config';
import {
  ApiConfigService,
  NetworkError,
  ValidationError,
  ServerError,
  AuthenticationError,
  Cache,
  withApiDefaults,
  createRetryPolicy
} from '../../lib/effect-config';

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: {
    key: string;
    ttl: number; // Time to live in milliseconds
  };
  retry?: {
    attempts: number;
    delay: number;
  };
}


// Base API Service
export class BaseApiService extends Context.Tag('BaseApiService')<
  BaseApiService,
  {
    request: <T>(
      config: RequestConfig,
      schema: Schema.Schema<T, any, never>
    ) => Effect.Effect<T, ApiError, ApiConfigService | Cache>;
  }
>() {}

// Implementation of the Base API Service
const makeBaseApiService = (): Effect.Effect<
  BaseApiService,
  never,
  ApiConfigService | Cache
> => {
  const request = <T>(
    config: RequestConfig,
    schema: Schema.Schema<T, any, never>
  ): Effect.Effect<T, ApiError, ApiConfigService | Cache> =>
    pipe(
      // Check cache first for GET requests
      config.method === 'GET' && config.cache
        ? Effect.flatMap(Cache, (cache) =>
            Effect.flatMap(cache.get(config.cache!.key), (cached) =>
              cached ? Effect.succeed(cached as T) : Effect.succeed(null)
            )
          )
        : Effect.succeed(null),

      Effect.flatMap((cached) => {
        if (cached) {
          return Effect.succeed(cached);
        }

        // Make the actual HTTP request
        return pipe(
          Effect.gen(function* () {
            const apiConfig = yield* ApiConfigService;
            const fullUrl = `${apiConfig.baseUrl}${config.url}`;

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
              return undefined as T;
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
            const validatedData = yield* Schema.decodeUnknown(schema)(jsonData).pipe(
              Effect.mapError((error) => new ValidationError({
                message: 'Response validation failed',
                errors: error.message ? [error.message] : ['Validation error']
              }))
            );

            // Cache the result if requested
            if (config.cache && config.method === 'GET') {
              yield* Effect.flatMap(Cache, (cache) =>
                cache.set(config.cache!.key, validatedData, config.cache!.ttl)
              );
            }

            return validatedData;
          }),

          // Apply retry policy
          config.retry
            ? createRetryPolicy(config.retry.attempts, config.retry.delay)
            : createRetryPolicy(3, 1000),

          // Apply default API configuration
          Effect.provide(ApiConfigService)
        );
      })
    );

  return Effect.succeed({ request } as any);
};

// Layer that provides the Base API Service
export const BaseApiServiceLive = Layer.effect(
  BaseApiService,
  makeBaseApiService()
);

// Utility functions for common operations
export const get = <T>(
  url: string,
  schema: Schema.Schema<T, any, never>,
  options?: { cache?: { key: string; ttl: number } }
) =>
  pipe(
    BaseApiService,
    Effect.flatMap((api) =>
      api.request(
        {
          method: 'GET',
          url,
          ...options
        },
        schema
      )
    )
  );

export const post = <T>(
  url: string,
  body: unknown,
  schema: Schema.Schema<T, any, never>
) =>
  pipe(
    BaseApiService,
    Effect.flatMap((api) =>
      api.request(
        { method: 'POST', url, body },
        schema
      )
    )
  );

export const patch = <T>(
  url: string,
  body: unknown,
  schema: Schema.Schema<T, any, never>
) =>
  pipe(
    BaseApiService,
    Effect.flatMap((api) =>
      api.request(
        { method: 'PATCH', url, body },
        schema
      )
    )
  );

export const del = <T>(
  url: string,
  schema: Schema.Schema<T, any, never>
) =>
  pipe(
    BaseApiService,
    Effect.flatMap((api) =>
      api.request(
        { method: 'DELETE', url },
        schema
      )
    )
  );

// Optimistic update helper
export const withOptimisticUpdate = <T, E, R>(
  optimisticValue: T,
  effect: Effect.Effect<T, E, R>,
  onRollback?: (error: E) => void
) => {
  // Return optimistic value immediately
  const optimistic = Effect.succeed(optimisticValue);

  // Run actual effect in the background
  Effect.fork(
    effect.pipe(
      Effect.tapError((error) => {
        onRollback?.(error);
        return Effect.succeed(void 0);
      })
    )
  );

  return optimistic;
};