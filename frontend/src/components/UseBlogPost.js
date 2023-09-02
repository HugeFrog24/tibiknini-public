import {useState, useCallback} from "react";

const useBlogPost = (apiUrl, accessToken) => {
    const [blogPost, setBlogPost] = useState(null);

    const fetchBlogPost = useCallback(async (id) => {
        const headers = accessToken
        ? { "Authorization": `Bearer ${accessToken}` }
        : {};

        const response = await fetch(`${apiUrl}/blog/posts/id/${id}/`, {
            headers: headers,
        });
        const data = await response.json();
        setBlogPost(data);
        return data;
        }, [apiUrl, accessToken]);

    const createBlogPost = useCallback(async (postData) => {
        const response = await fetch(`${apiUrl}/blog/posts/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(postData),
        });
        const data = await response.json();
        setBlogPost(data);
        return data;
    }, [apiUrl, accessToken]);

    const updateBlogPost = useCallback(async (id, postData) => {
        const response = await fetch(`${apiUrl}/blog/posts/id/${id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(postData),
        });
        const data = await response.json();
        setBlogPost(data);
        return data; // Return the response data
    }, [apiUrl, accessToken]);

    const deleteBlogPost = useCallback(async (id) => {
        await fetch(`${apiUrl}/blog/posts/id/${id}/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });
        setBlogPost(null);
    }, [apiUrl, accessToken]);

    return {
        blogPost,
        fetchBlogPost,
        createBlogPost,
        updateBlogPost,
        deleteBlogPost,
    };
};

export default useBlogPost;
