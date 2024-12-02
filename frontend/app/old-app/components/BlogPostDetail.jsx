import React, {useContext, useState} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from 'react-toastify';
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
    IconButton
} from '@mui/material';

import UserContext from "./contexts/UserContext";
import {REDIRECT_REASONS} from "./constants/Constants";
import BlogPostComments from "./BlogPostComments";
import api from "../utils/api";
import { getApiUrl } from "../../env.server";

const BlogPostDetail = ({ post }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(UserContext);
    const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
    const [isLiked, setIsLiked] = useState(post?.is_liked || false);
    const [isLikeButtonHovered, setIsLikeButtonHovered] = useState(false);

    if (!post) {
        return null;
    }

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: 'Check out this blog post!',
                url: url,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    navigator.clipboard.writeText(url);
                    toast.success('Link copied to clipboard!');
                }
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleEdit = () => {
        navigate(`/blog/edit/${post.id}`);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/blog/posts/id/${post.id}/`);
            navigate('/blog', { state: { redirectReason: REDIRECT_REASONS.POST_DELETED } });
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
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/api/blog/posts/id/${post.id}/like/`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to like post');
            }
            
            const data = await response.json();
            setLikesCount(data.likes_count);
            setIsLiked(data.is_liked);
        } catch (error) {
            console.error('Error liking post:', error);
            toast.error('Failed to like post');
        }
    };

    return (
        <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                {post.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={post.author?.profile_picture} alt={post.author?.username} />
                <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1">
                        {post.author?.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(post.created_at).toLocaleDateString()}
                    </Typography>
                </Box>
            </Box>

            {post.tags && post.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    {post.tags.map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                        />
                    ))}
                </Box>
            )}

            <Box sx={{ mb: 2 }}>
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Box>
                    <IconButton
                        onClick={handleLike}
                        onMouseEnter={() => setIsLikeButtonHovered(true)}
                        onMouseLeave={() => setIsLikeButtonHovered(false)}
                        color={isLiked ? "primary" : "default"}
                    >
                        <FavoriteIcon />
                    </IconButton>
                    <Typography variant="body2" component="span">
                        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
                    </Typography>
                    
                    <IconButton onClick={handleShare} sx={{ ml: 1 }}>
                        <ShareIcon />
                    </IconButton>
                </Box>

                {isAuthenticated && user?.id === post.author?.id && (
                    <Box>
                        <IconButton onClick={handleEdit} color="primary">
                            <EditIcon />
                        </IconButton>
                        <IconButton onClick={handleDelete} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <BlogPostComments postId={post.id} />
        </Box>
    );
};

export default BlogPostDetail;
