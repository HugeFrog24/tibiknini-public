import React, {useContext, useState} from "react";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { Pagination as MuiPagination } from '@mui/material';
import { Typography, Button, useTheme, Divider } from '@mui/material'; 
import { Add as AddIcon } from '@mui/icons-material';
import { Container, Grid, Box } from '@mui/material';

import BlogPostCard, { BlogPost, User } from "../old-app/components/BlogPostCard";
import UserContext from "../contexts/UserContext";

export interface BlogPostsResponse {
    results: BlogPost[];
    count: number;
    page_count: number;
}

interface BlogPostsListProps {
    postId?: string | number;
    initialData: BlogPostsResponse;
}

const BlogPostsList: React.FC<BlogPostsListProps> = ({postId, initialData}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get("page") || "1");
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(UserContext);
    const theme = useTheme();

    const blogPosts = initialData.results || [];
    const totalPages = initialData.page_count || 1;

    const handleAddPostClick = () => {
        navigate("/blog/posts/new");
    };

    const handlePostUpdated = (updatedPost: BlogPost) => {
        // Refresh the page to get updated data from the server
        window.location.reload();
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setSearchParams({ page: page.toString() });
    };

    const renderPagination = () => {
        return (
            <Box display="flex" justifyContent="center" mt={2}>
                <MuiPagination 
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                />
            </Box>
        );
    };

    const typedUser = user as User | null;

    return (
        <Container>
            <Box mb={3}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                        <Typography variant="h4" component="h1">Blog</Typography>
                    </Grid>
                    {isAuthenticated && !postId && (
                        <Grid item>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddPostClick}
                                startIcon={<AddIcon />}
                            >
                                New Post
                            </Button>
                        </Grid>
                    )}
                </Grid>
            </Box>
            <Divider />
            {blogPosts.length === 0 ? (
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
                            isDetailView={postId !== undefined}
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
