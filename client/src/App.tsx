
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit3, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    setIsLoading(true);
    try {
      const createInput: CreateTodoInput = { text: newTodoText.trim() };
      const newTodo = await trpc.createTodo.mutate(createInput);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updateInput: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editingId === null) return;

    try {
      const updateInput: UpdateTodoInput = {
        id: editingId,
        text: editText.trim()
      };
      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === editingId ? updatedTodo : t)
      );
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✨ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleCreateTodo} className="flex gap-3">
              <Input
                placeholder="What needs to be done? 📝"
                value={newTodoText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewTodoText(e.target.value)
                }
                className="flex-1 text-lg h-12"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !newTodoText.trim()}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        {totalCount > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              📊 Total: {totalCount}
            </Badge>
            <Badge variant="default" className="px-4 py-2 text-sm bg-green-600">
              ✅ Completed: {completedCount}
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              ⏳ Remaining: {totalCount - completedCount}
            </Badge>
          </div>
        )}

        {/* Todo List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
              Your Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todos.length === 0 ? (
              <div className="text-center py-12">
                <Circle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No todos yet!</p>
                <p className="text-gray-400">Add one above to get started 🚀</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {todos.map((todo: Todo, index: number) => (
                  <div 
                    key={todo.id} 
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="w-5 h-5"
                      />
                      
                      <div className="flex-1">
                        {editingId === todo.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editText}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                setEditText(e.target.value)
                              }
                              className="flex-1"
                              onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              onClick={handleSaveEdit}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className={`text-lg ${
                              todo.completed 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-900'
                            }`}>
                              {todo.text}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Created {todo.created_at.toLocaleDateString()} at{' '}
                              {todo.created_at.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </>
                        )}
                      </div>

                      {editingId !== todo.id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(todo)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTodo(todo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {index < todos.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Made with ❤️ using React & tRPC</p>
        </div>
      </div>
    </div>
  );
}

export default App;
