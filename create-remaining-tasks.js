/**
 * Script to create remaining Sprint 26 tasks for Individual Report Implementation
 */

const http = require('http');

const createTask = (taskData) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(taskData);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/issues',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

// Task 1: JCD-177 - Create Deployment Frequency Report
const deploymentTask = {
  title: "Create Deployment Frequency Report",
  description: `Build deployment frequency analytics component with DevOps metrics tracking and visualization.

## Technical Requirements

### Component Structure
- Create \`/components/Reports/DeploymentFrequency/DeploymentFrequency.tsx\`
- Implement deployment tracking with Git integration
- Build frequency charts with trend analysis
- Add DORA metrics calculation (deployment frequency, lead time)

### Data Integration
- Connect to Git repository for deployment data
- Track deployment events and timestamps
- Calculate deployment frequency metrics (daily, weekly, monthly)
- Implement failure rate tracking

### Visualization Features
- Deployment timeline with success/failure indicators
- Frequency bar charts with trend lines
- Risk assessment based on deployment patterns
- Lead time distribution analysis

### XState Integration
\`\`\`typescript
interface DeploymentContext {
  deployments: DeploymentEvent[];
  frequency: FrequencyMetrics;
  riskLevel: "low" | "medium" | "high";
  selectedTimeRange: TimeRange;
}
\`\`\`

### Effect.ts Pipeline
- Real-time deployment event streaming
- Automated metric calculation pipeline
- Risk assessment algorithms
- Historical data aggregation

## Acceptance Criteria
- [x] Component renders deployment frequency charts
- [x] Shows deployment success/failure rates
- [x] Calculates DORA metrics accurately
- [x] Integrates with project Git repository
- [x] Updates metrics in real-time
- [x] Provides actionable insights for teams

## Implementation Notes
- Use Chart.js for deployment timeline
- Implement Git webhook integration
- Add deployment risk assessment
- Include comparative team metrics`,
  type: "task",
  priority: "medium",
  status: "todo",
  projectId: 11,
  reporterId: 1,
  assigneeId: 1,
  estimate: 8,
  labels: ["reports", "analytics", "devops", "charts"]
};

// Task 2: JCD-178 - Integrate XState Analytics Machine
const xstateTask = {
  title: "Integrate XState Analytics Machine for Reports",
  description: `Build centralized XState machine for managing all analytics state and report interactions.

## Technical Requirements

### State Machine Architecture
- Create \`/machines/analytics.machine.ts\`
- Manage report data fetching and caching
- Handle user interactions and filters
- Coordinate between different report components

### Machine States
\`\`\`typescript
interface AnalyticsContext {
  activeReport: ReportType;
  dateRange: DateRange;
  filters: ReportFilters;
  data: {
    sprint: SprintData;
    velocity: VelocityData;
    burndown: BurndownData;
    deployment: DeploymentData;
  };
  loading: boolean;
  error: string | null;
}

states: {
  idle: {},
  loading: {
    invoke: {
      src: 'fetchReportData',
      onDone: 'ready',
      onError: 'error'
    }
  },
  ready: {
    on: {
      CHANGE_REPORT: { target: 'loading', actions: 'setActiveReport' },
      UPDATE_FILTERS: { actions: 'updateFilters' },
      REFRESH_DATA: 'loading'
    }
  },
  error: {}
}
\`\`\`

### Integration Points
- Connect with existing timer machine
- Integrate with project/sprint data
- Handle real-time updates via actors
- Manage navigation state between reports

### Data Services
- Sprint analytics service
- Velocity calculation service
- Burndown tracking service
- Deployment metrics service

## Acceptance Criteria
- [x] XState machine manages all report state
- [x] Smooth transitions between reports
- [x] Real-time data updates
- [x] Proper error handling and loading states
- [x] Filter synchronization across reports
- [x] Integration with existing state machines

## Implementation Notes
- Use XState v5 syntax with proper TypeScript
- Implement actor model for data services
- Add persistence for user preferences
- Include comprehensive error boundaries`,
  type: "task",
  priority: "high",
  status: "todo",
  projectId: 11,
  reporterId: 1,
  assigneeId: 1,
  estimate: 13,
  labels: ["xstate", "state-management", "reports", "analytics"]
};

// Task 3: JCD-179 - Add Effect.ts Data Pipeline
const effectTask = {
  title: "Add Effect.ts Data Pipeline for Real-time Analytics",
  description: `Implement Effect.ts pipeline for streaming analytics data with functional programming patterns.

## Technical Requirements

### Pipeline Architecture
- Create \`/services/effect/analytics.pipeline.ts\`
- Build streaming data transformations
- Implement real-time metric calculations
- Add error handling with Effect's error model

### Data Streams
\`\`\`typescript
import { Effect, Stream, Schedule } from 'effect'

// Sprint metrics stream
const sprintMetricsStream = Stream.fromAsyncIterable(
  sprintDataSource,
  (e) => new StreamError({ cause: e })
)

// Velocity calculation pipeline
const velocityPipeline = Stream.map(
  sprintMetricsStream,
  calculateVelocityMetrics
).pipe(
  Stream.schedule(Schedule.fixed('30 seconds')),
  Stream.retry(Schedule.exponential(1000))
)
\`\`\`

### Integration Services
- Sprint data aggregation service
- Issue status change streaming
- Time tracking event processing
- Deployment event streaming

### Error Handling
- Comprehensive error types for analytics
- Retry strategies for data fetching
- Graceful degradation on service failures
- Logging and monitoring integration

### Performance Optimization
- Efficient data caching strategies
- Debounced real-time updates
- Memory-efficient stream processing
- Background computation scheduling

## Acceptance Criteria
- [x] Real-time data streaming implemented
- [x] Functional error handling with Effect
- [x] Performance optimized for large datasets
- [x] Integration with XState analytics machine
- [x] Comprehensive logging and monitoring
- [x] Graceful handling of network failures

## Implementation Notes
- Use Effect.ts v3+ with latest APIs
- Implement proper resource management
- Add comprehensive error boundaries
- Include performance metrics tracking`,
  type: "task",
  priority: "high",
  status: "todo",
  projectId: 11,
  reporterId: 1,
  assigneeId: 1,
  estimate: 21,
  labels: ["effect-ts", "data-pipeline", "streaming", "analytics"]
};

async function createTasks() {
  console.log('🚀 Creating remaining Sprint 26 tasks...\n');

  try {
    // Create deployment task
    console.log('Creating JCD-177: Deployment Frequency Report...');
    const deployment = await createTask(deploymentTask);
    console.log(`✅ Created JCD-${deployment.id}: ${deployment.title}\n`);

    // Create XState task
    console.log('Creating JCD-178: XState Analytics Machine...');
    const xstate = await createTask(xstateTask);
    console.log(`✅ Created JCD-${xstate.id}: ${xstate.title}\n`);

    // Create Effect.ts task
    console.log('Creating JCD-179: Effect.ts Data Pipeline...');
    const effect = await createTask(effectTask);
    console.log(`✅ Created JCD-${effect.id}: ${effect.title}\n`);

    console.log('🎉 All tasks created successfully!');
    console.log('Sprint 26 "Phase 4: Enhanced Backlog & Planning" now includes:');
    console.log('- Individual Report Implementation (JCD-172 to JCD-179)');
    console.log('- XState integration for state management');
    console.log('- Effect.ts pipeline for real-time data processing');

  } catch (error) {
    console.error('❌ Error creating tasks:', error.message);
  }
}

createTasks();