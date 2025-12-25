/**
 * Schemas Zod para validação de formulários de Todo
 */

import { z } from 'zod';
import type { TodoStatus, TodoPriority } from './types';

export const todoFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done', 'canceled'] as const),
  priority: z.enum(['low', 'medium', 'high'] as const),
  assignedTo: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

export type TodoFormValues = z.infer<typeof todoFormSchema>;

