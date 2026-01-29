# GraphQL API Documentation

## Overview

המערכת כוללת GraphQL API מלא המאפשר ל-frontend לבחור בדיוק את השדות שהוא צריך.

## Features

- **Flexible Queries** - בחר בדיוק את השדות שאתה צריך
- **Type Safety** - Type-safe עם Strawberry
- **Permissions** - כל ה-queries בודקים הרשאות
- **Nested Queries** - גישה ל-relationships (tasks, todos, etc.)

## Endpoint

```
POST /graphql
```

## Authentication

שלח JWT token ב-`Authorization` header:
```
Authorization: Bearer <token>
```

## Queries

### Get Current User

```graphql
query {
  me {
    id
    email
    fullName
    isActive
  }
}
```

### Get Rooms

```graphql
query {
  rooms(limit: 10) {
    id
    name
    isShared
    tasks {
      id
      title
      completed
    }
  }
}
```

### Get Specific Room

```graphql
query {
  room(roomId: 1) {
    id
    name
    isShared
    tasks {
      id
      title
      completed
      dueDate
      todos {
        id
        title
        completed
      }
    }
  }
}
```

### Get Tasks

```graphql
query {
  tasks(roomId: 1, completed: false, limit: 20) {
    id
    title
    description
    completed
    dueDate
    category {
      id
      name
    }
    room {
      id
      name
    }
    todos {
      id
      title
      completed
    }
  }
}
```

### Get Specific Task

```graphql
query {
  task(taskId: 1) {
    id
    title
    description
    completed
    dueDate
    category {
      id
      name
      icon
    }
    room {
      id
      name
      isShared
    }
    todos {
      id
      title
      completed
    }
  }
}
```

### Get Categories

```graphql
query {
  categories {
    id
    name
    icon
  }
}
```

### Get Statistics

```graphql
query {
  statistics {
    totalTasks
    completedTasks
    pendingTasks
    completionRate
    avgTasksPerRoom
    roomsCount
  }
}
```

## Mutations

### Create Room

```graphql
mutation {
  createRoom(input: { name: "סלון" }) {
    id
    name
    isShared
  }
}
```

### Update Room

```graphql
mutation {
  updateRoom(roomId: 1, input: { name: "סלון מעודכן" }) {
    id
    name
  }
}
```

### Delete Room

```graphql
mutation {
  deleteRoom(roomId: 1)
}
```

### Create Task

```graphql
mutation {
  createTask(input: {
    title: "ניקיון"
    description: "ניקיון יסודי"
    roomId: 1
    dueDate: "2024-01-15T10:00:00Z"
  }) {
    id
    title
    completed
    room {
      id
      name
    }
  }
}
```

### Create Recurring Task

```graphql
mutation {
  createTask(input: {
    title: "ניקיון שבועי"
    roomId: 1
    rruleString: "FREQ=WEEKLY;BYDAY=MO"
    rruleStartDate: "2024-01-15T10:00:00Z"
  }) {
    id
    title
    isRecurringTemplate
  }
}
```

### Update Task

```graphql
mutation {
  updateTask(taskId: 1, input: {
    completed: true
    title: "ניקיון - הושלם"
  }) {
    id
    title
    completed
  }
}
```

### Delete Task

```graphql
mutation {
  deleteTask(taskId: 1)
}
```

### Create Category

```graphql
mutation {
  createCategory(input: {
    name: "ניקיון"
    icon: "🧹"
  }) {
    id
    name
    icon
  }
}
```

### Create Todo

```graphql
mutation {
  createTodo(input: {
    title: "לקנות חומרי ניקוי"
    taskId: 1
  }) {
    id
    title
    completed
  }
}
```

## Complex Queries

### Get Room with All Related Data

```graphql
query {
  room(roomId: 1) {
    id
    name
    isShared
    tasks(limit: 10) {
      id
      title
      description
      completed
      dueDate
      category {
        id
        name
        icon
      }
      todos {
        id
        title
        completed
      }
    }
  }
}
```

### Get Statistics with Filtered Tasks

```graphql
query {
  statistics {
    totalTasks
    completionRate
  }
  tasks(completed: false, limit: 5) {
    id
    title
    room {
      name
    }
  }
}
```

## Advantages of GraphQL

1. **Flexible** - בחר בדיוק את השדות שאתה צריך
2. **Single Request** - קבל כל הנתונים ב-request אחד
3. **Type Safe** - TypeScript types אוטומטיים
4. **Nested Queries** - גישה ל-relationships בקלות
5. **No Over-fetching** - רק הנתונים שאתה צריך

## Frontend Integration

### Using Apollo Client

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:8000/graphql',
  cache: new InMemoryCache(),
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const GET_ROOMS = gql`
  query GetRooms {
    rooms {
      id
      name
      tasks {
        id
        title
        completed
      }
    }
  }
`;

const { data } = await client.query({ query: GET_ROOMS });
```

### Using Fetch

```typescript
const query = `
  query {
    rooms {
      id
      name
      tasks {
        id
        title
      }
    }
  }
`;

const response = await fetch('http://localhost:8000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ query }),
});

const { data } = await response.json();
```

## GraphQL Playground

גש ל-`/graphql` בדפדפן כדי להשתמש ב-GraphQL Playground (בפיתוח).

## Best Practices

1. **Select Only Needed Fields** - בחר רק את השדות שאתה צריך
2. **Use Fragments** - השתמש ב-fragments לשאילתות חוזרות
3. **Batch Requests** - קבל כל הנתונים ב-request אחד
4. **Handle Errors** - טיפול בשגיאות GraphQL
5. **Cache Results** - Cache תוצאות עם Apollo Client

## Error Handling

GraphQL מחזיר errors ב-`errors` array:

```json
{
  "data": null,
  "errors": [
    {
      "message": "You don't have access to this room",
      "path": ["room"]
    }
  ]
}
```

## Permissions

כל ה-queries בודקים הרשאות:
- Rooms - רק owned + shared rooms
- Tasks - רק tasks בחדרים עם גישה
- Mutations - בודקים הרשאות עריכה/מחיקה

## Performance

- **N+1 Problem** - נפתר עם DataLoader (ניתן להוסיף)
- **Caching** - השתמש ב-Apollo Client cache
- **Pagination** - תמיכה ב-skip/limit
