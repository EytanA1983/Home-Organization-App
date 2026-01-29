/**
 * API Module
 *
 * Central export for all API-related functionality.
 *
 * Usage:
 *   // Import hooks
 *   import { useRooms, useCreateTask, useTasks } from '@/api';
 *
 *   // Import types
 *   import type { Room, Task, User } from '@/api';
 *
 *   // Import client directly
 *   import { api, configureApiClient } from '@/api';
 */

// Re-export generated types and client
export * from './generated';

// Re-export hooks
export * from './hooks';

// Type aliases for common schemas
export type { Schemas } from './generated';

// Convenience type exports (will work after generation)
// These provide shorter names for common types
export type Room = import('./generated').Schemas['RoomResponse'];
export type RoomCreate = import('./generated').Schemas['RoomCreate'];
export type RoomUpdate = import('./generated').Schemas['RoomUpdate'];

export type Task = import('./generated').Schemas['TaskRead'];
export type TaskCreate = import('./generated').Schemas['TaskCreate'];
export type TaskUpdate = import('./generated').Schemas['TaskUpdate'];

export type Category = import('./generated').Schemas['CategoryRead'];
export type CategoryCreate = import('./generated').Schemas['CategoryCreate'];
export type CategoryUpdate = import('./generated').Schemas['CategoryUpdate'];

export type Todo = import('./generated').Schemas['TodoRead'];
export type TodoCreate = import('./generated').Schemas['TodoCreate'];
export type TodoUpdate = import('./generated').Schemas['TodoUpdate'];

export type User = import('./generated').Schemas['UserRead'];
export type UserCreate = import('./generated').Schemas['UserCreate'];
export type UserLogin = import('./generated').Schemas['UserLogin'];
export type Token = import('./generated').Schemas['Token'];
