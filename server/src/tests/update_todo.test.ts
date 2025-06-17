
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo text', async () => {
    // Create test todo first
    const created = await db.insert(todosTable)
      .values({
        text: 'Original text',
        completed: false
      })
      .returning()
      .execute();

    const todoId = created[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      text: 'Updated text'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.text).toEqual('Updated text');
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update todo completed status', async () => {
    // Create test todo first
    const created = await db.insert(todosTable)
      .values({
        text: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = created[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.text).toEqual('Test todo'); // Should remain unchanged
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both text and completed status', async () => {
    // Create test todo first
    const created = await db.insert(todosTable)
      .values({
        text: 'Original text',
        completed: false
      })
      .returning()
      .execute();

    const todoId = created[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      text: 'Updated text',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.text).toEqual('Updated text');
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated todo to database', async () => {
    // Create test todo first
    const created = await db.insert(todosTable)
      .values({
        text: 'Original text',
        completed: false
      })
      .returning()
      .execute();

    const todoId = created[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      text: 'Updated text',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes were saved
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].text).toEqual('Updated text');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999,
      text: 'Updated text'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/Todo with ID 999 not found/i);
  });

  it('should update timestamp even when no other fields change', async () => {
    // Create test todo first
    const created = await db.insert(todosTable)
      .values({
        text: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = created[0].id;
    const originalUpdatedAt = created[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTodoInput = {
      id: todoId
    };

    const result = await updateTodo(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});
