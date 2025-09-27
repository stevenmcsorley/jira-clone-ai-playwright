/**
 * Simplified Effect.ts API Service
 *
 * A basic working version for testing compilation
 */

import { Effect } from 'effect';
import * as Schema from 'effect/Schema';
import type { ApiError } from '../../lib/effect-config';
import { NetworkError, ValidationError } from '../../lib/effect-config';

// Simple API call function
export const simpleApiCall = <T>(
  url: string,
  schema: Schema.Schema<T, any, never>
): Effect.Effect<T, ApiError, never> =>
  Effect.gen(function* () {
    // Make fetch request
    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (error) => new NetworkError({
        message: `Network request failed: ${String(error)}`
      })
    });

    // Check response
    if (!response.ok) {
      return yield* Effect.fail(new NetworkError({
        message: `HTTP ${response.status}`,
        status: response.status
      }));
    }

    // Parse JSON
    const text = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: (error) => new NetworkError({
        message: `Failed to read response: ${String(error)}`
      })
    });

    const json = yield* Effect.try({
      try: () => JSON.parse(text),
      catch: (error) => new ValidationError({
        message: 'Invalid JSON response',
        errors: [String(error)]
      })
    });

    // Validate with schema
    return yield* Schema.decodeUnknown(schema)(json).pipe(
      Effect.mapError((error) => new ValidationError({
        message: 'Response validation failed',
        errors: [String(error)]
      }))
    );
  });

// Example usage schema
export const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String
});

// Example function
export const getUser = (id: number) =>
  simpleApiCall(`/api/users/${id}`, UserSchema);