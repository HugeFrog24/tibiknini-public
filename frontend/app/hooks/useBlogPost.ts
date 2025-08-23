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

export const useBlogPost = () => {
    const fetchBlogPost = async (id: string | number): Promise<BlogPost> => {
        const response = await api.get(`/blog/posts/id/${id}/`);
        return response.data;
    };

    const createBlogPost = async (post: BlogPostInput): Promise<BlogPost> => {
        const response = await api.post('/blog/posts/', post);
        return response.data;
    };

    const updateBlogPost = async (id: number, post: BlogPostInput): Promise<BlogPost> => {
        const response = await api.put(`/blog/posts/id/${id}/`, post);
        return response.data;
    };

    return {
        fetchBlogPost,
        createBlogPost,
        updateBlogPost,
    };
};

export type { BlogPost, BlogPostInput, Tag };
