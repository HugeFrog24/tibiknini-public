import { useState, useCallback } from "react";
import api from '../utils/api';

const useBlogPost = () => {
    const [blogPost, setBlogPost] = useState(null);

    const fetchBlogPost = useCallback(async (id) => {
        try {
            const response = await api.get(`/blog/posts/id/${id}/`);
            setBlogPost(response.data);
            return response.data;
        } catch (error) {
            if (error?.response?.status === 404) {
                throw error?.response?.status;
            }
            console.error(error);
        }
    }, []);

    const createBlogPost = useCallback(async (postData) => {
        try {
            const response = await api.post(`/blog/posts/`, postData);
            setBlogPost(response.data);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }, []);

    const updateBlogPost = useCallback(async (id, postData) => {
        try {
            const response = await api.put(`/blog/posts/id/${id}/`, postData);
            setBlogPost(response.data);
            return response.data; // Return the response data
        } catch (error) {
            console.error(error);
        }
    }, []);

    const deleteBlogPost = useCallback(async (id) => {
        try {
            await api.delete(`/blog/posts/id/${id}/`);
            setBlogPost(null);
        } catch (error) {
            console.error(error);
        }
    }, []);

    return {
        blogPost,
        fetchBlogPost,
        createBlogPost,
        updateBlogPost,
        deleteBlogPost,
    };
};

export default useBlogPost;
