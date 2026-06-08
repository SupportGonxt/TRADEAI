// Revolutionary Data Fetcher Hook
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useNotifications } from '../components/NotificationCenter';

// Data fetcher state
export interface DataFetcherState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  retry: () => void;
  refresh: () => void;
}

// Use data fetcher hook
export const useDataFetcher = <T>(
  url: string,
  options?: AxiosRequestConfig
): DataFetcherState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const { showError } = useNotifications();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      const response = await axios(url, {
        ...options,
        timeout: 10000 // 10 second timeout
      });

      // Check if response is ok
      if (!response.status || response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if we have data
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Handle different response structures
      let responseData: T;
      if (response.data.data) {
        responseData = response.data.data;
      } else if (Array.isArray(response.data)) {
        responseData = response.data as unknown as T;
      } else {
        responseData = response.data;
      }

      setData(responseData);
      
      // Check if data is empty
      if (Array.isArray(responseData) && responseData.length === 0) {
        setIsEmpty(true);
      } else if (responseData && typeof responseData === 'object' && Object.keys(responseData).length === 0) {
        setIsEmpty(true);
      }

    } catch (err) {
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof AxiosError) {
        if (err.response) {
          // Server responded with error status
          switch (err.response.status) {
            case 401:
              errorMessage = 'Authentication required. Please log in.';
              break;
            case 403:
              errorMessage = 'Access denied. You do not have permission to view this data.';
              break;
            case 404:
              errorMessage = 'Data not found.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
          }
        } else if (err.request) {
          // Network error
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Request setup error
          errorMessage = err.message || 'Request failed';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      showError(errorMessage, 'Data Loading Failed');
    } finally {
      setLoading(false);
    }
  }, [url, options, showError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retry function
  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isEmpty,
    retry,
    refresh
  };
};

// Use mutation hook for POST/PUT/DELETE operations
export const useDataMutator = <T, R = any>() => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { showError, showSuccess } = useNotifications();

  const mutate = useCallback(async (
    url: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: T,
    options?: AxiosRequestConfig
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const config: AxiosRequestConfig = {
        method,
        url,
        ...options,
        timeout: 10000
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axios(config);

      // Check if response is ok
      if (!response.status || response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setSuccess(true);
      
      // Show success message based on operation
      let successMessage = '';
      switch (method) {
        case 'POST':
          successMessage = 'Successfully created';
          break;
        case 'PUT':
        case 'PATCH':
          successMessage = 'Successfully updated';
          break;
        case 'DELETE':
          successMessage = 'Successfully deleted';
          break;
        default:
          successMessage = 'Operation successful';
      }
      
      showSuccess(successMessage);

      return response.data;
    } catch (err) {
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof AxiosError) {
        if (err.response) {
          // Server responded with error status
          switch (err.response.status) {
            case 400:
              errorMessage = 'Invalid data provided. Please check your input.';
              break;
            case 401:
              errorMessage = 'Authentication required.';
              break;
            case 403:
              errorMessage = 'Access denied. You do not have permission for this operation.';
              break;
            case 404:
              errorMessage = 'Resource not found.';
              break;
            case 409:
              errorMessage = 'Conflict detected. This item may already exist.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = err.response.data?.message || `Server error (${err.response.status})`;
          }
        } else if (err.request) {
          // Network error
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Request setup error
          errorMessage = err.message || 'Request failed';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      showError(errorMessage, 'Operation Failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  return {
    mutate,
    loading,
    error,
    success
  };
};

export default useDataFetcher;