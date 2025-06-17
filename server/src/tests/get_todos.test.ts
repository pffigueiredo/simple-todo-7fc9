
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos with separate insert operations to ensure different timestamps
    await db.insert(todosTable)
      .values({ text: 'First todo', completed: false })
      .execute();

    await db.insert(todosTable)
      .values({ text: 'Second todo', completed: true })
      .execute();

    await db.insert(todosTable)
      .values({ text: 'Third todo', completed: false })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos have required fields
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(todo.text).toBeDefined();
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
    });

    // Verify todos are ordered by creation date (newest first)
    const todoTexts = result.map(todo => todo.text);
    expect(todoTexts).toEqual(['Third todo', 'Second todo', 'First todo']);
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({ text: 'Oldest todo', completed: false })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ text: 'Middle todo', completed: false })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ text: 'Newest todo', completed: false })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].text).toEqual('Newest todo');
    expect(result[1].text).toEqual('Middle todo');
    expect(result[2].text).toEqual('Oldest todo');

    // Verify ordering by timestamp
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return todos with correct field types', async () => {
    await db.insert(todosTable)
      .values({ text: 'Test todo', completed: true })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];
    
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.text).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
    expect(todo.completed).toBe(true);
  });
});
