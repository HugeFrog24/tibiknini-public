import * as React from "react";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Favorite as FavoriteIcon,
    Edit as EditIcon,
    Share as ShareIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import ReactMarkdown from "react-markdown";
import {
    Avatar,
    Typography,
    Box,
    Chip,
    IconButton,
    Container,
    Paper
} from '@mui/material';

import UserContext, { type UserContextType } from "../contexts/UserContext";
import BlogPostComments from "./BlogPostComments";
import api from "../utils/api";

interface Author {
    id: number;
    username: string;
    profile_picture?: string;
}

export interface BlogPost {
    id: number;
    title: string;
    content: string;
    author: Author;
    pub_date: string;
    tags: string[];
    likes_count: number;
    is_liked: boolean;
    description?: string;
}

interface BlogPostDetailProps {
    post: BlogPost;
}

interface LikeResponse {
    likes_count: number;
    is_liked: boolean;
}

export default function BlogPostDetail({ post }: BlogPostDetailProps) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = React.useContext<UserContextType>(UserContext);
    const [likesCount, setLikesCount] = React.useState(post?.likes_count || 0);
    const [isLiked, setIsLiked] = React.useState(post?.is_liked || false);
    const { comments = [], reportReasons = [] } = useLoaderData<{ comments: any[]; reportReasons: any[]; }>();

    if (!post) {
        return null;
    }

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: post.title,
                    text: 'Check out this blog post!',
                    url: url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
        }
    };

    const handleEdit = () => {
        navigate(`/blog/edit/${post.id}`);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/blog/posts/id/${post.id}/`);
            navigate('/blog', { 
                state: { redirectReason: 'POST_DELETED' }
            });
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Failed to delete post');
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to like posts');
            return;
        }

        try {
            const response = await api.post<LikeResponse>(`/blog/posts/id/${post.id}/like/`);
            const { likes_count, is_liked } = response.data;
            setLikesCount(likes_count);
            setIsLiked(is_liked);
        } catch (error) {
            console.error('Error liking post:', error);
            toast.error('Failed to like post');
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={0} sx={{ p: 3, my: 3 }}>
                <Typography 
                    variant="h1" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        fontWeight: 'bold',
                        mb: 3
                    }}
                >
                    {post.title}
                </Typography>
                
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3,
                    gap: 2
                }}>
                    <Avatar 
                        src={post.author?.profile_picture} 
                        alt={post.author?.username}
                        sx={{ width: 48, height: 48 }}
                    />
                    <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                            {post.author?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(post.pub_date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Typography>
                    </Box>
                </Box>

                {post.tags && post.tags.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        {post.tags.map((tag) => (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ 
                                    mr: 1, 
                                    mb: 1,
                                    '&:hover': {
                                        backgroundColor: 'primary.light'
                                    }
                                }}
                            />
                        ))}
                    </Box>
                )}

                <Box sx={{ 
                    mb: 4,
                    '& img': {
                        maxWidth: '100%',
                        height: 'auto'
                    }
                }}>
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </Box>

                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderTop: 1,
                    borderColor: 'divider',
                    pt: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={handleLike}
                            color={isLiked ? "primary" : "default"}
                            aria-label={isLiked ? "Unlike post" : "Like post"}
                        >
                            <FavoriteIcon />
                        </IconButton>
                        <Typography variant="body2" component="span">
                            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                        </Typography>
                        
                        <IconButton 
                            onClick={handleShare}
                            aria-label="Share post"
                            sx={{ ml: 1 }}
                        >
                            <ShareIcon />
                        </IconButton>
                    </Box>

                    {isAuthenticated && user?.id === post.author?.id && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                                onClick={handleEdit}
                                color="primary"
                                aria-label="Edit post"
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton 
                                onClick={handleDelete}
                                color="error"
                                aria-label="Delete post"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Paper>

            <BlogPostComments 
                postId={post.id} 
                comments={comments} 
                reportReasons={reportReasons} 
            />
        </Container>
    );
}
