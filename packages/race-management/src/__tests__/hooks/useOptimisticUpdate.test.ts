import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticUpdate } from '../../hooks/useOptimisticUpdate';

describe('useOptimisticUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with initial data', () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    expect(result.current.data).toEqual(initialData);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update data optimistically', async () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const updatedData = [{ id: 1, name: 'Updated Item' }];
    const updateFn = jest.fn().mockResolvedValue(updatedData);

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    await act(async () => {
      await result.current.update(updateFn, updatedData);
    });

    // Data should be updated immediately (optimistically)
    expect(result.current.data).toEqual(updatedData);
    expect(updateFn).toHaveBeenCalled();
  });

  it('should rollback on error', async () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const updatedData = [{ id: 1, name: 'Updated Item' }];
    const error = new Error('Update failed');
    const updateFn = jest.fn().mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, { onError, rollbackDelay: 100 })
    );

    await act(async () => {
      await result.current.update(updateFn, updatedData);
    });

    // Should update optimistically first
    expect(result.current.data).toEqual(updatedData);

    // Wait for rollback
    await waitFor(() => {
      expect(result.current.data).toEqual(initialData);
      expect(result.current.error).toEqual(error);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('should handle batch updates', async () => {
    const initialData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    const batchUpdate = [
      { id: 1, name: 'Updated 1' },
      { id: 2, name: 'Updated 2' }
    ];
    const updateFn = jest.fn().mockResolvedValue(batchUpdate);

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    await act(async () => {
      await result.current.batchUpdate(
        [() => updateFn()],
        batchUpdate
      );
    });

    expect(result.current.data).toEqual(batchUpdate);
  });

  it('should call onSuccess callback', async () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const updatedData = [{ id: 1, name: 'Updated Item' }];
    const updateFn = jest.fn().mockResolvedValue(updatedData);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, { onSuccess })
    );

    await act(async () => {
      await result.current.update(updateFn, updatedData);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(updatedData);
    });
  });

  it('should handle concurrent updates', async () => {
    const initialData = [{ id: 1, value: 0 }];
    const update1 = [{ id: 1, value: 1 }];
    const update2 = [{ id: 1, value: 2 }];
    
    const updateFn1 = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(update1), 100))
    );
    const updateFn2 = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(update2), 50))
    );

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    await act(async () => {
      // Start both updates concurrently
      const promise1 = result.current.update(updateFn1, update1);
      const promise2 = result.current.update(updateFn2, update2);
      
      await Promise.all([promise1, promise2]);
    });

    // The last update should win
    expect(result.current.data).toEqual(update2);
  });

  it('should reset error state on successful update', async () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const updatedData = [{ id: 1, name: 'Updated Item' }];
    const error = new Error('Previous error');
    
    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    // Set error state
    act(() => {
      result.current.error = error;
    });

    const updateFn = jest.fn().mockResolvedValue(updatedData);

    await act(async () => {
      await result.current.update(updateFn, updatedData);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle undefined optimistic data', async () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const serverData = [{ id: 1, name: 'Server Updated' }];
    const updateFn = jest.fn().mockResolvedValue(serverData);

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    await act(async () => {
      // Don't provide optimistic data
      await result.current.update(updateFn);
    });

    // Should use server response
    expect(result.current.data).toEqual(serverData);
  });

  it('should track pending state correctly', async () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const updatedData = [{ id: 1, name: 'Updated Item' }];
    const updateFn = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(updatedData), 100))
    );

    const { result } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    expect(result.current.isPending).toBe(false);

    const updatePromise = act(async () => {
      await result.current.update(updateFn, updatedData);
    });

    // Should be pending during update
    expect(result.current.isPending).toBe(true);

    await updatePromise;

    // Should not be pending after update
    expect(result.current.isPending).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const initialData = [{ id: 1, name: 'Item 1' }];
    const { unmount } = renderHook(() => 
      useOptimisticUpdate(initialData, {})
    );

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });
});