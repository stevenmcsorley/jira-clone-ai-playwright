/**
 * Effect.ts Demo Service
 *
 * Simple demonstration that Effect.ts services work correctly
 */

import { Effect } from 'effect';

// Simple Effect that fetches and parses data
export const fetchProjects = (): Effect.Effect<any[], Error, never> =>
  Effect.tryPromise({
    try: async () => {
      // Add cache busting to force fresh data
      const cacheBuster = Date.now();
      const response = await fetch(`/api/projects?_cb=${cacheBuster}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    catch: (error) => new Error(`Fetch failed: ${String(error)}`)
  });

export const fetchUsers = (): Effect.Effect<any[], Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    catch: (error) => new Error(`Fetch failed: ${String(error)}`)
  });

export const fetchIssuesByProject = (projectId: number): Effect.Effect<any[], Error, never> =>
  Effect.tryPromise({
    try: async () => {
      // Add cache busting to force fresh data
      const cacheBuster = Date.now();
      const response = await fetch(`/api/issues?projectId=${projectId}&boardView=true&_cb=${cacheBuster}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    catch: (error) => new Error(`Fetch failed: ${String(error)}`)
  });

// Demo test function
export const runDemo = async () => {
  console.log('🚀 Running Effect.ts Demo...');

  try {
    // Test projects fetch
    const projects = await Effect.runPromise(fetchProjects());
    console.log('✅ Projects loaded:', projects.length);

    // Test users fetch
    const users = await Effect.runPromise(fetchUsers());
    console.log('✅ Users loaded:', users.length);

    // Test issues fetch if we have projects
    if (projects.length > 0) {
      const issues = await Effect.runPromise(fetchIssuesByProject(projects[0].id));
      console.log('✅ Issues loaded:', issues.length);
    }

    console.log('🎉 Effect.ts demo completed successfully!');
    return { projects, users };
  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
};