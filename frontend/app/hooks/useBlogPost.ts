import api from '../utils/api';

interface Tag {
    name: string;
    color: string;
}

interface BlogPost {
    id: number;
    title: string;
    content: string;
    is_draft: boolean;
    pub_date: string;
    image: string | null;
    tags: Tag[];
    likes_count: number;
    is_liked: boolean;
    accent_color: string | null;
    author: {
        id: number;
        username: string;
        image: string;
        is_staff: boolean;
        bio: string;
    };
}

interface BlogPostInput {
    title: string;
    content: string;
    is_draft: boolean;
}

interface TaskResponse {
    task_id: string;
    status: 'processing';
    message: string;
}

interface TaskStatusResponse {
    status: 'processing' | 'completed' | 'failed' | 'error';
    result?: {
        success: boolean;
        post_id?: number;
        title?: string;
        is_draft?: boolean;
        created_at?: string;
        updated_at?: string;
        error?: string;
    };
    error?: string;
    message?: string;
}

export const useBlogPost = () => {
    const fetchBlogPost = async (id: string | number): Promise<BlogPost> => {
        const response = await api.get(`/blog/posts/id/${id}/`);
        return response.data;
    };

    const createBlogPost = async (post: BlogPostInput): Promise<TaskResponse> => {
        const response = await api.post('/blog/posts/', post);
        return response.data;
    };

    const updateBlogPost = async (id: number, post: BlogPostInput): Promise<TaskResponse> => {
        const response = await api.put(`/blog/posts/id/${id}/`, post);
        return response.data;
    };

    const deleteBlogPost = async (id: number): Promise<TaskResponse> => {
        const response = await api.delete(`/blog/posts/id/${id}/`);
        return response.data;
    };

    const checkTaskStatus = async (taskId: string, taskType: 'create' | 'update' | 'delete' = 'create', postId?: number): Promise<TaskStatusResponse> => {
        let url: string;
        
        if (taskType === 'create') {
            url = `/blog/posts/task-status/${taskId}/`;
        } else if (taskType === 'update') {
            url = `/blog/posts/id/${postId}/task-status/${taskId}/`;
        } else if (taskType === 'delete') {
            url = `/blog/posts/id/${postId}/delete-task-status/${taskId}/`;
        } else {
            throw new Error('Invalid task type');
        }
        
        const response = await api.get(url);
        return response.data;
    };

    const pollTaskCompletion = async (
        taskId: string,
        taskType: 'create' | 'update' | 'delete' = 'create',
        postId?: number,
        onProgress?: (status: string) => void
    ): Promise<BlogPost | { success: boolean; post_id?: number; title?: string }> => {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const statusResponse = await checkTaskStatus(taskId, taskType, postId);
                    
                    if (onProgress) {
                        onProgress(statusResponse.status);
                    }
                    
                    if (statusResponse.status === 'completed') {
                        if (statusResponse.result?.success) {
                            if (taskType === 'delete') {
                                // For deletion, just return the result
                                resolve(statusResponse.result);
                            } else if (statusResponse.result.post_id) {
                                // For create/update, fetch the complete blog post data
                                const blogPost = await fetchBlogPost(statusResponse.result.post_id);
                                resolve(blogPost);
                            } else {
                                reject(new Error(statusResponse.result?.error || 'Task completed but failed'));
                            }
                        } else {
                            reject(new Error(statusResponse.result?.error || 'Task completed but failed'));
                        }
                    } else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
                        reject(new Error(statusResponse.error || 'Task failed'));
                    } else {
                        // Still processing, poll again
                        setTimeout(poll, 1000);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            poll();
        });
    };

    return {
        fetchBlogPost,
        createBlogPost,
        updateBlogPost,
        deleteBlogPost,
        checkTaskStatus,
        pollTaskCompletion,
    };
};

export type { BlogPost, BlogPostInput, Tag };
