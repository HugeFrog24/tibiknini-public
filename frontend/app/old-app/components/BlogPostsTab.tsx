import React, {useCallback, useEffect, useState} from "react";
import { Typography, Box, Alert } from '@mui/material';
import BlogPostCard, { BlogPost } from "./BlogPostCard";
import api from '../utils/api';

interface BlogPostsTabProps {
    username: string;
}

const BlogPostsTab: React.FC<BlogPostsTabProps> = ({username}) => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBlogPosts = useCallback(
        async (retryAttempt: number) => {
            setIsLoading(true);
            setHasError(false);
            const url = `/blog/posts/author/${username}/`;
            try {
                const response = await api.get(url);
                setBlogPosts(response.data.results);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching blog posts:", error);
                if (retryAttempt < 3) {
                    setTimeout(() => {
                        fetchBlogPosts(retryAttempt + 1);
                    }, 3000 * retryAttempt);
                } else {
                    setIsLoading(false);
                    setHasError(true);
                }
            }
        },
        [username]
    );

    useEffect(() => {
        fetchBlogPosts(1);
    }, [fetchBlogPosts]);

    return (
        <Box>
            {isLoading ? (
                <Box>
                    {Array(5).fill(0).map((_, index) => (
                        <BlogPostCard key={index} />
                    ))}
                </Box>
            ) : hasError ? (
                <Box mt={2} textAlign="center">
                    <Alert severity="warning">
                        Error retrieving data
                    </Alert>
                </Box>
            ) : blogPosts.length === 0 ? (
                <Box mt={2}>
                    <Typography variant="h5" component="h3">Nothing to show</Typography>
                    <Typography>There are no blog posts available at this time.</Typography>
                </Box>
            ) : (
                blogPosts.map((post, index) => (
                    <BlogPostCard
                        key={post.id || index}
                        post={post}
                    />
                ))
            )}
        </Box>
    );
};

export default BlogPostsTab;
