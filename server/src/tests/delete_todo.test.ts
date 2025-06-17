
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

const testInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        text: 'Test todo to delete'
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Delete the todo
    const result = await deleteTodo({ id: todoId });

    expect(result.success).toBe(true);

    // Verify the todo is deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should throw error when todo does not exist', async () => {
    // Try to delete a non-existent todo
    await expect(deleteTodo({ id: 999 })).rejects.toThrow(/todo with id 999 not found/i);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const createResults = await db.insert(todosTable)
      .values([
        { text: 'Todo 1' },
        { text: 'Todo 2' },
        { text: 'Todo 3' }
      ])
      .returning()
      .execute();

    const todoToDelete = createResults[1]; // Delete the middle one

    // Delete one todo
    const result = await deleteTodo({ id: todoToDelete.id });

    expect(result.success).toBe(true);

    // Verify only the targeted todo is deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(t => t.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(t => t.id === createResults[0].id)).toBeDefined();
    expect(remainingTodos.find(t => t.id === createResults[2].id)).toBeDefined();
  });
});
