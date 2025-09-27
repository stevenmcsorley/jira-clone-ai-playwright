/**
 * Service Testing Utility
 *
 * Simple test to verify that our Effect.ts services compile and work
 */

import { Effect } from 'effect';
import { runWithRuntime } from '../../lib/effect-runtime';
import { IssuesService, ProjectsService, UsersService } from './index';

// Test function to verify services work
export const testServices = async () => {
  console.log('🧪 Testing Effect.ts services...');

  try {
    // Test Projects Service
    console.log('Testing ProjectsService...');
    const projects = await runWithRuntime(ProjectsService.getAll());
    console.log('✅ Projects loaded:', projects.length);

    // Test Users Service
    console.log('Testing UsersService...');
    const users = await runWithRuntime(UsersService.getAll());
    console.log('✅ Users loaded:', users.length);

    // Test Issues Service
    if (projects.length > 0) {
      console.log('Testing IssuesService...');
      const issues = await runWithRuntime(IssuesService.getByProject(projects[0].id));
      console.log('✅ Issues loaded:', issues.length);
    }

    console.log('🎉 All services working correctly!');
    return true;
  } catch (error) {
    console.error('❌ Service test failed:', error);
    return false;
  }
};

// Individual service test functions
export const testProjectsService = () =>
  runWithRuntime(
    Effect.gen(function* () {
      console.log('Testing Projects Service...');

      // Test getting all projects
      const projects = yield* ProjectsService.getAll();
      console.log(`Found ${projects.length} projects`);

      if (projects.length > 0) {
        // Test getting single project
        const project = yield* ProjectsService.getById(projects[0].id);
        console.log(`Project details:`, project.name);
      }

      return projects;
    }).pipe(
      Effect.tap(projects => Effect.sync(() =>
        console.log('✅ Projects service test passed')
      )),
      Effect.tapError(error => Effect.sync(() =>
        console.error('❌ Projects service test failed:', error)
      ))
    )
  );

export const testIssuesService = (projectId: number) =>
  runWithRuntime(
    Effect.gen(function* () {
      console.log('Testing Issues Service...');

      // Test getting issues by project
      const issues = yield* IssuesService.getByProject(projectId);
      console.log(`Found ${issues.length} issues for project ${projectId}`);

      if (issues.length > 0) {
        // Test getting single issue
        const issue = yield* IssuesService.getById(issues[0].id);
        console.log(`Issue details:`, issue.title);
      }

      return issues;
    }).pipe(
      Effect.tap(issues => Effect.sync(() =>
        console.log('✅ Issues service test passed')
      )),
      Effect.tapError(error => Effect.sync(() =>
        console.error('❌ Issues service test failed:', error)
      ))
    )
  );

export const testUsersService = () =>
  runWithRuntime(
    Effect.gen(function* () {
      console.log('Testing Users Service...');

      // Test getting all users
      const users = yield* UsersService.getAll();
      console.log(`Found ${users.length} users`);

      if (users.length > 0) {
        // Test getting single user
        const user = yield* UsersService.getById(users[0].id);
        console.log(`User details:`, user.name);
      }

      return users;
    }).pipe(
      Effect.tap(users => Effect.sync(() =>
        console.log('✅ Users service test passed')
      )),
      Effect.tapError(error => Effect.sync(() =>
        console.error('❌ Users service test failed:', error)
      ))
    )
  );

// Test optimistic updates
export const testOptimisticUpdates = (issueId: number) =>
  runWithRuntime(
    Effect.gen(function* () {
      console.log('Testing optimistic updates...');

      // Get current issue
      const currentIssue = yield* IssuesService.getById(issueId);
      console.log('Current issue status:', currentIssue.status);

      // Test status change with optimistic update
      const newStatus = currentIssue.status === 'todo' ? 'in_progress' : 'todo';

      console.log(`Changing status from ${currentIssue.status} to ${newStatus}...`);
      const updatedIssue = yield* IssuesService.updateStatus(issueId, newStatus, currentIssue);

      console.log('Updated issue status:', updatedIssue.status);
      return updatedIssue;
    }).pipe(
      Effect.tap(() => Effect.sync(() =>
        console.log('✅ Optimistic update test passed')
      )),
      Effect.tapError(error => Effect.sync(() =>
        console.error('❌ Optimistic update test failed:', error)
      ))
    )
  );

// Export a comprehensive test function
export const runAllTests = async () => {
  console.log('🚀 Running comprehensive Effect.ts services tests...');

  try {
    // Test basic service functionality
    await testProjectsService();
    await testUsersService();

    // Get a project to test issues
    const projects = await runWithRuntime(ProjectsService.getAll());
    if (projects.length > 0) {
      await testIssuesService(projects[0].id);

      // Test optimistic updates if there are issues
      const issues = await runWithRuntime(IssuesService.getByProject(projects[0].id));
      if (issues.length > 0) {
        await testOptimisticUpdates(issues[0].id);
      }
    }

    console.log('🎉 All comprehensive tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Comprehensive tests failed:', error);
    return false;
  }
};