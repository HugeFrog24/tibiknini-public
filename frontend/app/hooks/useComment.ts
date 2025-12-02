import { useState } from 'react';
import api from '../utils/api';

interface TaskResponse {
  task_id: string;
  status: string;
  message: string;
}

interface TaskResult {
  success: boolean;
  comment_id?: number;
  content?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  post_id?: number;
  deleted_at?: string;
  error?: string;
  analysis?: {
    severity_score: number;
    max_severity: string;
    flagged_word_count: number;
    action_required: boolean;
    auto_hidden: boolean;
    summary: string;
  };
  warning?: string;
}

interface TaskStatusResponse {
  status: 'processing' | 'completed' | 'failed' | 'error';
  result?: TaskResult;
  error?: string;
  message?: string;
}

export const useComment = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createComment = async (postId: number, content: string): Promise<TaskResponse> => {
    setIsLoading(true);
    try {
      const response = await api.post(`/blog/posts/id/${postId}/comments/`, {
        content
      });
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateComment = async (postId: number, commentId: number, content: string): Promise<TaskResponse> => {
    setIsLoading(true);
    try {
      const response = await api.patch(`/blog/posts/id/${postId}/comments/${commentId}/`, {
        content
      });
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (postId: number, commentId: number): Promise<TaskResponse> => {
    setIsLoading(true);
    try {
      const response = await api.delete(`/blog/posts/id/${postId}/comments/${commentId}/`);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const checkTaskStatus = async (postId: number, taskId: string): Promise<TaskStatusResponse> => {
    const response = await api.get(`/blog/posts/id/${postId}/comments/task-status/${taskId}/`);
    return response.data;
  };

  const pollTaskCompletion = async (
    taskId: string,
    operation: 'create' | 'update' | 'delete',
    postId: number,
    onStatusUpdate?: (status: string) => void
  ): Promise<TaskResult> => {
    return new Promise((resolve, reject) => {
      const pollInterval = window.setInterval(async () => {
        try {
          const statusResponse = await checkTaskStatus(postId, taskId);
          
          if (onStatusUpdate) {
            onStatusUpdate(statusResponse.status);
          }

          if (statusResponse.status === 'completed') {
            window.clearInterval(pollInterval);
            if (statusResponse.result) {
              resolve(statusResponse.result);
            } else {
              reject(new Error('Task completed but no result returned'));
            }
          } else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
            window.clearInterval(pollInterval);
            reject(new Error(statusResponse.error || 'Task failed'));
          }
          // Continue polling if status is 'processing'
        } catch (error) {
          window.clearInterval(pollInterval);
          reject(error);
        }
      }, 1000); // Poll every second

      // Set a timeout to prevent infinite polling
      window.setTimeout(() => {
        window.clearInterval(pollInterval);
        reject(new Error('Task polling timeout'));
      }, 30000); // 30 second timeout
    });
  };

  return {
    createComment,
    updateComment,
    deleteComment,
    checkTaskStatus,
    pollTaskCompletion,
    isLoading
  };
};