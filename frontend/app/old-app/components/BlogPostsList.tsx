import React, {useCallback, useContext, useEffect, useState} from "react";
import { useNavigate } from "@remix-run/react";
import { Pagination as MuiPagination } from '@mui/material';
import { Typography, Button, useTheme, Divider } from '@mui/material'; 
import { Add as AddIcon } from '@mui/icons-material';
import { Container, Grid, Box, Alert } from '@mui/material';

import BlogPostCard, { BlogPost, User } from "./BlogPostCard";
import UserContext from "./contexts/UserContext";
import api from "../utils/api";

interface BlogPostsListProps {
  postId?: string | number;
}

const BlogPostsList: React.FC<BlogPostsListProps> = ({postId}) => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const isDetailView = postId !== undefined;
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(UserContext);
    const theme = useTheme();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchBlogPosts = useCallback(
        (retryAttempt = 0, page = 1) => {
            setIsLoading(true);
            setHasError(false);
            const url = postId
                ? `/blog/posts/id/${postId}/`
                : `/blog/posts/?page=${page}`;

            api.get(url)
                .then((response) => {
                    const data = response.data;
                    if (!data) {
                        throw new Error('No data received');
                    }
                    setBlogPosts(postId ? [data].filter(Boolean) : (data.results || []));
                    if (data.page_count) {
                        setTotalPages(data.page_count);
                    } else if (data.count) {
                        const calculatedPages = Math.ceil(data.count / 10);
                        setTotalPages(calculatedPages);
                    } else {
                        setTotalPages(1);
                    }
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching blog posts:", error);
                    setBlogPosts([]);
                    if (retryAttempt < 3) {
                        setTimeout(() => {
                            fetchBlogPosts(retryAttempt + 1, page);
                        }, 3000 * retryAttempt);
                    } else {
                        setIsLoading(false);
                        setHasError(true);
                    }
                });
        },
        [postId]
    );

    const handleAddPostClick = () => {
        navigate("/blog/posts/new");
    };

    const handlePostUpdated = (updatedPost: BlogPost) => {
        setBlogPosts((prevPosts) => {
            const index = prevPosts.findIndex((post) => post.id === updatedPost.id);
            if (index === -1) return prevPosts;
            
            const updatedPosts = [...prevPosts];
            updatedPosts[index] = {
                ...updatedPosts[index],
                ...updatedPost,
            };
            return updatedPosts;
        });
    };

    const handleRetryClick = () => {
        fetchBlogPosts(1);
    };

    const renderPagination = () => {
        return (
            <Box display="flex" justifyContent="center" mt={2}>
                <MuiPagination 
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                />
            </Box>
        );
    };

    useEffect(() => {
        fetchBlogPosts(1, currentPage);
    }, [fetchBlogPosts, currentPage]);

    const typedUser = user as User | null;

    return (
        <Container>
            <Box mb={3}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h4" component="h1">Blog</Typography>
                    </Grid>
                    {isAuthenticated && typedUser?.is_staff && !isDetailView && (
                        <Grid item>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddPostClick}
                                startIcon={<AddIcon />}
                            >
                                Add Post
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Box>
            <Divider />
            {isLoading ? (
                <Box mt={2}>
                    {Array(5).fill(0).map((_, index) => (
                        <BlogPostCard key={index} />
                    ))}
                </Box>
            ) : hasError ? (
                <Box mt={2} textAlign="center">
                    <Alert severity="warning" 
                        action={
                            <Button color="inherit" size="small" onClick={handleRetryClick}>
                                Retry
                            </Button>
                        }
                    >
                        Error retrieving data
                    </Alert>
                </Box>
            ) : blogPosts.length === 0 ? (
                <Box mt={2}>
                    <Typography variant="h5" component="h3">Nothing to show</Typography>
                    <Typography>There are no blog posts available at this time.</Typography>
                </Box>
            ) : (
                <Box mt={2}>
                    {blogPosts.map((post, index) => (
                        <BlogPostCard
                            key={post.id || index}
                            post={post}
                            isDetailView={isDetailView}
                            user={typedUser}
                            postId={postId}
                            textClass={theme.palette.mode === 'dark' ? 'text-light' : 'text-dark'}
                            onPostUpdated={handlePostUpdated}
                        />
                    ))}
                    {blogPosts.length > 0 && renderPagination()}
                </Box>
            )}
        </Container>
    );
};

export default BlogPostsList;
