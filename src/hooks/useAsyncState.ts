import { useState, useCallback } from 'react';

// 异步状态的类型定义
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// useAsyncState Hook的返回类型
export interface UseAsyncStateReturn<T> extends AsyncState<T> {
  setData: (data: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  execute: (asyncFn: () => Promise<T>) => Promise<void>;
}

// 初始状态
const createInitialState = <T>(): AsyncState<T> => ({
  data: null,
  loading: false,
  error: null,
});

/**
 * 通用的异步状态管理Hook
 * 统一管理loading、error、data状态，减少重复代码
 *
 * @param initialData 初始数据
 * @returns 异步状态和操作方法
 */
export function useAsyncState<T>(
  initialData: T | null = null
): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T>>(() => ({
    ...createInitialState<T>(),
    data: initialData,
  }));

  // 设置数据
  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data, error: null }));
  }, []);

  // 设置加载状态
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  // 设置错误信息
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setState(createInitialState<T>());
  }, []);

  // 执行异步操作
  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await asyncFn();
      setState((prev) => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, []);

  return {
    ...state,
    setData,
    setLoading,
    setError,
    reset,
    execute,
  };
}

/**
 * 带重试功能的异步状态管理Hook
 *
 * @param initialData 初始数据
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟时间(ms)
 * @returns 异步状态和操作方法（包含重试功能）
 */
export function useAsyncStateWithRetry<T>(
  initialData: T | null = null,
  maxRetries: number = 3,
  retryDelay: number = 1000
): UseAsyncStateReturn<T> & { retry: () => Promise<void> } {
  const asyncState = useAsyncState<T>(initialData);
  const [lastAsyncFn, setLastAsyncFn] = useState<(() => Promise<T>) | null>(
    null
  );

  // 带重试的执行函数
  const executeWithRetry = useCallback(
    async (asyncFn: () => Promise<T>) => {
      setLastAsyncFn(() => asyncFn);

      const attemptExecution = async (attempt: number): Promise<void> => {
        try {
          asyncState.setLoading(true);
          asyncState.setError(null);
          const result = await asyncFn();
          asyncState.setData(result);
          asyncState.setLoading(false);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '未知错误';

          if (attempt < maxRetries) {
            setTimeout(() => attemptExecution(attempt + 1), retryDelay);
          } else {
            asyncState.setError(`${errorMessage} (重试${maxRetries}次后失败)`);
            asyncState.setLoading(false);
          }
        }
      };

      await attemptExecution(1);
    },
    [asyncState, maxRetries, retryDelay]
  );

  // 手动重试
  const retry = useCallback(async () => {
    if (lastAsyncFn) {
      await executeWithRetry(lastAsyncFn);
    }
  }, [lastAsyncFn, executeWithRetry]);

  return {
    ...asyncState,
    execute: executeWithRetry,
    retry,
  };
}

// 常用的异步操作类型
export type AsyncOperation<T> = () => Promise<T>;

// 预定义的错误处理函数
export const handleAsyncError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '发生未知错误';
};
