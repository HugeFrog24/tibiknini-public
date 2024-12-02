interface BlogPost {
    id: number;
    title: string;
    content: string;
    is_draft: boolean;
    author: {
        id: number;
    };
}

interface BlogPostInput {
    title: string;
    content: string;
    is_draft: boolean;
}

export const useBlogPost = () => {
    const fetchBlogPost = async (id: string | number): Promise<BlogPost> => {
        const response = await fetch(`/api/blog/posts/${id}/`);
        if (!response.ok) {
            throw new Error('Failed to fetch blog post');
        }
        return response.json();
    };

    const createBlogPost = async (post: BlogPostInput): Promise<BlogPost> => {
        const response = await fetch('/api/blog/posts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            throw new Error('Failed to create blog post');
        }
        return response.json();
    };

    const updateBlogPost = async (id: number, post: BlogPostInput): Promise<BlogPost> => {
        const response = await fetch(`/api/blog/posts/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            throw new Error('Failed to update blog post');
        }
        return response.json();
    };

    return {
        fetchBlogPost,
        createBlogPost,
        updateBlogPost,
    };
};

export type { BlogPost, BlogPostInput };
