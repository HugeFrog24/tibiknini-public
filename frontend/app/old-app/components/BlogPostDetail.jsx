import React, {useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Favorite as FavoriteIcon,
    Edit as EditIcon,
    Share as ShareIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import ReactMarkdown from "react-markdown";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
    Avatar,
    Button,
    Grid2,
    Typography,
    Box,
    Chip,
    IconButton
} from '@mui/material';

import UserContext from "./contexts/UserContext";
import UseBlogPost from "./UseBlogPost";
import {REDIRECT_REASONS} from "./constants/Constants";
import BlogPostComments from "./BlogPostComments";
import config from '../config.json';
import api from "../utils/api";

const BlogPostDetail = ({previousPath}) => {
    const {postId} = useParams();
    const {fetchBlogPost, deleteBlogPost} = UseBlogPost();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useContext(UserContext);
    const [postState, setPostState] = useState(null);
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeButtonHovered, setIsLikeButtonHovered] = useState(false);

    const handleShare = () => {
        const url = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: postState.title,
                text: 'Check out this blog post!',
                url: url,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    navigator.clipboard.writeText(url);
                    toast.success("URL copied to clipboard!");
                } else {
                    toast.info("Sharing canceled.");
                }
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success("URL copied to clipboard!");
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const post = await fetchBlogPost(postId);
                if (post) {
                    setPostState(post);
                    setLikesCount(post.likes_count);
                    setIsLiked(post.is_liked);
                }
            } catch (errorCode) {
                console.error("Failed to fetch post with error code:", errorCode);
                if (errorCode === 404) {
                    navigate("/error-404");
                }
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId, fetchBlogPost, navigate]);

    const handleLike = async () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { reason: REDIRECT_REASONS.LIKE_POST } });
            return;
        }

        try {
            const response = await api({
                method: isLiked ? 'delete' : 'post',
                url: `/blog/posts/id/${postId}/like/`
            });

            if ((isLiked && response.status === 204) || (!isLiked && response.status === 201)) {
                setIsLiked(!isLiked);
                setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
            } else {
                console.error('Failed to like/unlike post:', response.statusText);
            }
        } catch (error) {
            console.error('Failed to like/unlike post:', error);
        }
    };

    const handleDelete = async () => {
        await deleteBlogPost(postState.id);
        navigate("/blog");
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderTags = (tags) => {
        if (!tags || tags.length === 0) {
            return null;
        }

        return (
            <Box mt={2}>
                <Typography variant="subtitle1" fontWeight="bold">Tags</Typography>
                <Box>
                    {tags.map((tag, index) => (
                        <Chip
                            key={index}
                            label={`#${tag.name}`}
                            style={{backgroundColor: tag.color, color: "#FFF", marginRight: 8}}
                        />
                    ))}
                </Box>
            </Box>
        );
    };

    return (
        <Box textAlign="left">
            <ToastContainer autoClose={3000}/>
            {postState ? (
                <Box id={`post-${postState.id}`}>
                    {isAuthenticated &&
                        (user.is_staff || user.id === postState.author.id) && (
                            <Box display="flex" justifyContent="flex-end" mb={3}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => navigate(`/blog/posts/${postState.id}/edit`)}
                                    startIcon={<EditIcon />}
                                    sx={{ mr: 1 }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleDelete}
                                    startIcon={<DeleteIcon />}
                                >
                                    Remove
                                </Button>
                            </Box>
                        )}
                    <Grid2 container justifyContent="space-between" alignItems="flex-start">
                        <Grid2>
                            <Typography variant="h4" component="h2">{postState.title}</Typography>
                            {postState.author ? (
                                <Box component="a" href={`/users/${postState.author.username}`} sx={{textDecoration: 'none', display: 'flex', gap: 1, alignItems: 'center'}}>
                                    <Avatar
                                        src={postState.author?.image}
                                        alt={postState.author?.username}
                                        sx={{ width: 16, height: 16 }}
                                    />
                                    <Typography variant="body2">{postState.author.username}</Typography>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">Unknown Author</Typography>
                            )}
                        </Grid2>
                        <Grid2 alignSelf="flex-end">
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(postState.pub_date)}
                            </Typography>
                        </Grid2>
                    </Grid2>
                    <Box my={2}><hr/></Box>
                    <Box>
                        <ReactMarkdown>{postState.content}</ReactMarkdown>
                    </Box>
                    {renderTags(postState.tags)}
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                            variant="outlined"
                            color="primary"
                            sx={{ mr: 1 }}
                            onClick={handleLike}
                            onMouseOver={() => setIsLikeButtonHovered(true)}
                            onMouseOut={() => setIsLikeButtonHovered(false)}
                            startIcon={<FavoriteIcon sx={{ color: isLiked || isLikeButtonHovered ? 'red' : 'inherit' }} />}
                        >
                            {likesCount}
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleShare}
                            startIcon={<ShareIcon />}
                        >
                            Share
                        </Button>
                    </Box>
                    <BlogPostComments postId={postId} />
                </Box>
            ) : (
                // Skeleton placeholders for loading state
                <Box>
                    <Skeleton height={40} width={300} sx={{mb: 3}} />
                    <Grid2 container justifyContent="space-between" alignItems="flex-start">
                        <Grid2>
                            <Skeleton variant="circular" height={16} width={16} sx={{mr: 1}} />
                            <Skeleton width={100} />
                        </Grid2>
                        <Grid2>
                            <Skeleton width={120} />
                        </Grid2>
                    </Grid2>
                    <Box my={2}><hr /></Box>
                    <Skeleton count={5} />
                </Box>
            )}
        </Box>
    );
};

export default BlogPostDetail;