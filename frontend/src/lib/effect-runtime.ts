/**
 * Effect.ts Runtime and Development Tools
 *
 * This module provides runtime setup and development utilities for Effect.ts
 */

import { Effect, Layer, Runtime } from 'effect';
import { ApiConfigLive, CacheLive } from './effect-config';
import { BaseApiServiceLive } from '../services/effect/base-api.service';

// Create the main runtime with all layers
const MainLayer = Layer.mergeAll(
  ApiConfigLive,
  CacheLive,
  BaseApiServiceLive
);

// Create runtime instance
export const runtime = Runtime.defaultRuntime.pipe(
  Runtime.provide(MainLayer)
);

// Utility to run effects with the main runtime
export const runWithRuntime = <A, E>(
  effect: Effect.Effect<A, E, any>
): Promise<A> => {
  return Runtime.runPromise(runtime)(effect);
};

// Development helper to log effect results
export const logResult = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  label?: string
): Effect.Effect<A, E, R> => {
  return Effect.tap(effect, (result) =>
    Effect.sync(() => console.log(`[Effect${label ? ` - ${label}` : ''}]`, result))
  ).pipe(
    Effect.tapError((error) =>
      Effect.sync(() => console.error(`[Effect Error${label ? ` - ${label}` : ''}]`, error))
    )
  );
};

// Safe effect runner for React components
export const safeRun = <A>(
  effect: Effect.Effect<A, any, any>,
  onSuccess?: (value: A) => void,
  onError?: (error: any) => void
) => {
  Runtime.runPromise(runtime)(effect)
    .then(onSuccess)
    .catch(onError);
};