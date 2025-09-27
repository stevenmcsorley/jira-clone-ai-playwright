# Effect.ts Services

This directory contains Effect.ts-based services for robust API management, error handling, and side effect management.

## Architecture Overview

The Effect.ts integration provides:

- **Type-safe error handling** with tagged errors
- **Automatic retry logic** with exponential backoff
- **Request/response caching** with TTL support
- **Optimistic updates** with automatic rollback
- **Composable service patterns** using Effect context

## Core Components

### Base API Service (`base-api.service.ts`)

Foundation for all API operations:

```typescript
import { get, post, patch, del } from './base-api.service';
import * as Schema from 'effect/Schema';

// Define response schema
const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String
});

// Make API calls with automatic validation
const fetchUser = (id: number) =>
  get(`/users/${id}`, UserSchema, {
    cache: { key: `user-${id}`, ttl: 5000 }
  });
```

### Error Types

- `NetworkError`: Connection/HTTP errors
- `ValidationError`: Schema validation failures
- `AuthenticationError`: 401/403 responses
- `ServerError`: 5xx responses
- `ConflictError`: Business logic conflicts

### React Integration

Use the provided hooks for seamless React integration:

```typescript
import { useEffect_, useEffectAction } from '../../lib/effect-hooks';
import { fetchUser } from '../services/effect/user.service';

// Declarative data fetching
const UserProfile = ({ userId }: { userId: number }) => {
  const { data, error, loading } = useEffect_(fetchUser(userId), [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No user found</div>;

  return <div>Welcome, {data.name}!</div>;
};

// Action-based operations
const CreateUserForm = () => {
  const { execute, loading, error } = useEffectAction(createUser);

  const handleSubmit = async (userData: CreateUserRequest) => {
    try {
      await execute(userData);
      // Success handling
    } catch (err) {
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  );
};
```

## Development Tools

### Runtime Setup

The main runtime is configured in `src/lib/effect-runtime.ts`:

```typescript
import { runWithRuntime } from '../lib/effect-runtime';

// Run any effect with the configured runtime
const result = await runWithRuntime(someEffect);
```

### Logging and Debugging

Use the logging utilities for development:

```typescript
import { logResult } from '../lib/effect-runtime';

const debuggedEffect = pipe(
  myEffect,
  logResult('User API')
);
```

## Migration from Traditional Services

When migrating existing API services:

1. **Replace Promise-based APIs** with Effect-based ones
2. **Add schema validation** for all responses
3. **Implement proper error handling** with tagged errors
4. **Add caching where appropriate** for performance
5. **Use optimistic updates** for better UX

Example migration:

```typescript
// Before (traditional Promise-based)
class UserService {
  static async getUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }
}

// After (Effect-based)
export const getUser = (id: number) =>
  get(`/users/${id}`, UserSchema, {
    cache: { key: `user-${id}`, ttl: 30000 }
  });
```

## Best Practices

1. **Always define schemas** for API responses
2. **Use caching** for read operations where appropriate
3. **Implement optimistic updates** for write operations
4. **Handle all error types** explicitly
5. **Compose effects** rather than nesting promises
6. **Use the runtime utilities** for React integration

## Testing

Effect.ts provides excellent testing utilities:

```typescript
import { Effect } from 'effect';

describe('User Service', () => {
  it('should fetch user successfully', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' };

    const result = await Effect.runPromise(
      getUser(1).pipe(
        Effect.provide(MockApiLayer)
      )
    );

    expect(result).toEqual(mockUser);
  });
});
```