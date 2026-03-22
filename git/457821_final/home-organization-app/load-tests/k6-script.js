/**
 * k6 Load Testing Script for Eli Maor API
 * ========================================
 *
 * Tests:
 * - REST API endpoints (auth, rooms, tasks, categories)
 * - WebSocket connections
 * - Various load patterns (ramp-up, stress, soak)
 *
 * Installation:
 *   # macOS
 *   brew install k6
 *
 *   # Windows (chocolatey)
 *   choco install k6
 *
 *   # Docker
 *   docker run --rm -i grafana/k6 run - < k6-script.js
 *
 * Usage:
 *   # Basic run (100 VUs for 5 minutes)
 *   k6 run k6-script.js
 *
 *   # Custom VUs and duration
 *   k6 run --vus 200 --duration 10m k6-script.js
 *
 *   # With Grafana dashboard
 *   k6 run --out influxdb=http://localhost:8086/k6 k6-script.js
 *
 *   # Specific scenario
 *   k6 run --env SCENARIO=stress k6-script.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// ==================== Configuration ====================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const WS_URL = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

// Custom metrics
const errorRate = new Rate('errors');
const taskCreationTrend = new Trend('task_creation_time');
const wsConnectionTrend = new Trend('ws_connection_time');
const wsMessageCounter = new Counter('ws_messages');

// ==================== Test Scenarios ====================

export const options = {
  scenarios: {
    // Scenario 1: Smoke test (quick validation)
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { scenario: 'smoke' },
      env: { SCENARIO: 'smoke' },
    },

    // Scenario 2: Load test (normal load)
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { scenario: 'load' },
      env: { SCENARIO: 'load' },
    },

    // Scenario 3: Stress test (beyond normal load)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100
        { duration: '3m', target: 200 },  // Ramp up to 200
        { duration: '3m', target: 200 },  // Stay at 200
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { scenario: 'stress' },
      env: { SCENARIO: 'stress' },
    },

    // Scenario 4: Spike test (sudden spike)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // Warm up
        { duration: '30s', target: 200 },  // Spike to 200
        { duration: '1m', target: 200 },   // Stay at 200
        { duration: '30s', target: 10 },   // Scale down
        { duration: '1m', target: 10 },    // Recovery
      ],
      tags: { scenario: 'spike' },
      env: { SCENARIO: 'spike' },
    },

    // Scenario 5: Soak test (endurance)
    soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      tags: { scenario: 'soak' },
      env: { SCENARIO: 'soak' },
    },
  },

  // Thresholds
  thresholds: {
    // HTTP thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],  // 95% under 2s, 99% under 5s
    http_req_failed: ['rate<0.05'],                   // Error rate under 5%

    // Custom thresholds
    errors: ['rate<0.1'],                             // Error rate under 10%
    task_creation_time: ['p(95)<3000'],               // Task creation under 3s
    ws_connection_time: ['p(95)<5000'],               // WS connect under 5s
  },
};

// ==================== Test Data ====================

const roomNames = ['סלון', 'מטבח', 'חדר שינה', 'חדר אמבטיה', 'משרד', 'מרפסת'];
const taskTitles = ['לנקות', 'לסדר', 'לארגן', 'לשטוף', 'לקנות', 'לתקן'];
const priorities = ['low', 'medium', 'high'];

// ==================== Helper Functions ====================

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function login() {
  const email = `loadtest_${randomString(8)}@test.com`;
  const password = 'LoadTest123!';

  // Try login with test user
  let response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'loadtest_user_0@test.com', password: 'LoadTest123!' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );

  if (response.status === 200) {
    return JSON.parse(response.body).access_token;
  }

  // Register new user
  response = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      email: email,
      password: password,
      name: `Load Test User ${randomString(5)}`,
    }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'register' } }
  );

  if (response.status === 200 || response.status === 201) {
    // Login
    response = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: email, password: password }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
    );

    if (response.status === 200) {
      return JSON.parse(response.body).access_token;
    }
  }

  return null;
}

// ==================== Setup & Teardown ====================

export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Scenario: ${__ENV.SCENARIO || 'default'}`);

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'API is healthy': (r) => r.status === 200,
  });

  if (healthCheck.status !== 200) {
    throw new Error('API health check failed');
  }

  return { baseUrl: BASE_URL };
}

export function teardown(data) {
  console.log('Load test completed');
}

// ==================== Main Test Function ====================

export default function () {
  // Login once per VU
  let token = login();

  if (!token) {
    errorRate.add(1);
    console.error('Failed to authenticate');
    sleep(5);
    return;
  }

  const headers = getAuthHeaders(token);
  let rooms = [];
  let tasks = [];

  // ==================== Health Checks ====================

  group('Health Checks', () => {
    let response = http.get(`${BASE_URL}/health`, { tags: { name: 'health' } });
    check(response, {
      'health check status 200': (r) => r.status === 200,
    });

    response = http.get(`${BASE_URL}/ready`, { tags: { name: 'ready' } });
    check(response, {
      'ready check status 200': (r) => r.status === 200,
    });
  });

  sleep(randomIntBetween(1, 2));

  // ==================== Rooms ====================

  group('Rooms API', () => {
    // List rooms
    let response = http.get(`${BASE_URL}/api/rooms`, { headers, tags: { name: 'list_rooms' } });

    let listSuccess = check(response, {
      'list rooms status 200': (r) => r.status === 200,
      'list rooms has data': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch {
          return false;
        }
      },
    });

    if (listSuccess && response.status === 200) {
      rooms = JSON.parse(response.body);
    }

    // Create room (30% chance)
    if (Math.random() < 0.3) {
      const roomName = `${roomNames[randomIntBetween(0, roomNames.length - 1)]} ${randomString(4)}`;

      response = http.post(
        `${BASE_URL}/api/rooms`,
        JSON.stringify({
          name: roomName,
          description: 'Load test room',
        }),
        { headers, tags: { name: 'create_room' } }
      );

      check(response, {
        'create room status 200/201': (r) => r.status === 200 || r.status === 201,
      });

      if (response.status === 200 || response.status === 201) {
        rooms.push(JSON.parse(response.body));
      }
    }

    // Get specific room (if any exist)
    if (rooms.length > 0) {
      const room = rooms[randomIntBetween(0, rooms.length - 1)];
      response = http.get(
        `${BASE_URL}/api/rooms/${room.id}`,
        { headers, tags: { name: 'get_room' } }
      );

      check(response, {
        'get room status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(randomIntBetween(1, 3));

  // ==================== Tasks ====================

  group('Tasks API', () => {
    // List tasks
    let response = http.get(`${BASE_URL}/api/tasks`, { headers, tags: { name: 'list_tasks' } });

    let listSuccess = check(response, {
      'list tasks status 200': (r) => r.status === 200,
    });

    if (listSuccess && response.status === 200) {
      tasks = JSON.parse(response.body);
    }

    // Create task (50% chance)
    if (Math.random() < 0.5) {
      const title = `${taskTitles[randomIntBetween(0, taskTitles.length - 1)]} ${randomString(5)}`;
      const roomId = rooms.length > 0 ? rooms[randomIntBetween(0, rooms.length - 1)].id : null;

      const startTime = Date.now();

      response = http.post(
        `${BASE_URL}/api/tasks`,
        JSON.stringify({
          title: title,
          description: 'Load test task',
          room_id: roomId,
          priority: priorities[randomIntBetween(0, priorities.length - 1)],
        }),
        { headers, tags: { name: 'create_task' } }
      );

      const duration = Date.now() - startTime;
      taskCreationTrend.add(duration);

      check(response, {
        'create task status 200/201': (r) => r.status === 200 || r.status === 201,
        'create task time < 3s': () => duration < 3000,
      });

      if (response.status === 200 || response.status === 201) {
        tasks.push(JSON.parse(response.body));
      }
    }

    // Complete task (if incomplete tasks exist)
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length > 0 && Math.random() < 0.3) {
      const task = incompleteTasks[randomIntBetween(0, incompleteTasks.length - 1)];

      response = http.put(
        `${BASE_URL}/api/tasks/${task.id}/complete`,
        null,
        { headers, tags: { name: 'complete_task' } }
      );

      check(response, {
        'complete task status 200': (r) => r.status === 200,
      });
    }

    // List with filters
    response = http.get(
      `${BASE_URL}/api/tasks?completed=false`,
      { headers, tags: { name: 'list_tasks_filtered' } }
    );

    check(response, {
      'filtered tasks status 200': (r) => r.status === 200,
    });
  });

  sleep(randomIntBetween(1, 3));

  // ==================== Categories ====================

  group('Categories API', () => {
    let response = http.get(`${BASE_URL}/api/categories`, { headers, tags: { name: 'list_categories' } });

    check(response, {
      'list categories status 200': (r) => r.status === 200,
    });

    // Create category (20% chance)
    if (Math.random() < 0.2) {
      response = http.post(
        `${BASE_URL}/api/categories`,
        JSON.stringify({
          name: `Category ${randomString(5)}`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        }),
        { headers, tags: { name: 'create_category' } }
      );

      check(response, {
        'create category status 200/201': (r) => r.status === 200 || r.status === 201,
      });
    }
  });

  sleep(randomIntBetween(1, 2));

  // ==================== WebSocket Test (10% of iterations) ====================

  if (Math.random() < 0.1) {
    group('WebSocket', () => {
      const wsUrl = `${WS_URL}/ws?token=${token}`;
      const startTime = Date.now();

      const res = ws.connect(wsUrl, null, function (socket) {
        const connectionTime = Date.now() - startTime;
        wsConnectionTrend.add(connectionTime);

        socket.on('open', () => {
          // Send ping
          socket.send(JSON.stringify({ type: 'ping' }));
          wsMessageCounter.add(1);
        });

        socket.on('message', (msg) => {
          wsMessageCounter.add(1);
        });

        socket.on('error', (e) => {
          errorRate.add(1);
          console.error('WebSocket error:', e);
        });

        // Keep connection open for a short time
        socket.setTimeout(() => {
          socket.close();
        }, 5000);
      });

      check(res, {
        'WebSocket connection established': (r) => r && r.status === 101,
      });
    });
  }

  sleep(randomIntBetween(2, 5));
}

// ==================== Scenario-Specific Tests ====================

export function smokeTest() {
  // Quick validation
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    'smoke: health ok': (r) => r.status === 200,
  });
}

export function stressTest() {
  // Run default with stress parameters
  default();
}

// ==================== Summary Handler ====================

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    scenario: __ENV.SCENARIO || 'default',
    metrics: {
      vus: data.metrics.vus?.values?.value || 0,
      iterations: data.metrics.iterations?.values?.count || 0,
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_duration_avg: data.metrics.http_req_duration?.values?.avg || 0,
      http_req_duration_p95: data.metrics.http_req_duration?.values['p(95)'] || 0,
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
      errors_rate: data.metrics.errors?.values?.rate || 0,
    },
  };

  return {
    'stdout': JSON.stringify(summary, null, 2) + '\n',
    'summary.json': JSON.stringify(data, null, 2),
  };
}
