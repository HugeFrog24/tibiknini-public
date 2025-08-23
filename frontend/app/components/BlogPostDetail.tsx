import * as React from "react";
import { useNavigate, Link, useFetcher, useActionData } from "react-router";
import {
    Favorite as FavoriteIcon,
    Edit as EditIcon,
    Share as ShareIcon,
    Delete as DeleteIcon,
    Flag as FlagIcon
} from '@mui/icons-material';
import ReactMarkdown from "react-markdown";
import {
    Avatar,
    Typography,
    Box,
    Chip,
    IconButton,
    Container,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Button,
    Tooltip
} from '@mui/material';

import UserContext, { type UserContextType } from "../contexts/UserContext";
import BlogPostComments from "./BlogPostComments";
import api from "../utils/api";
import { showToastMessage, ACTIONS } from "../constants/Constants";

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

interface ReportReason {
    id: number;
    name: string;
}

interface BlogPostDetailProps {
    post: BlogPost;
    comments?: any[];
    reportReasons?: ReportReason[];
}

export default function BlogPostDetail({ post, comments = [], reportReasons = [] }: BlogPostDetailProps) {
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const actionData = useActionData() as { success?: boolean; error?: string; report?: any } | undefined;
    const { user, isAuthenticated } = React.useContext<UserContextType>(UserContext);
    const [likesCount, setLikesCount] = React.useState(post.likes_count);
    const [isLiked, setIsLiked] = React.useState(post.is_liked);
    
    // Report dialog state
    const [reportDialogOpen, setReportDialogOpen] = React.useState(false);
    const [selectedReason, setSelectedReason] = React.useState('');
    const [reportDescription, setReportDescription] = React.useState('');

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
                showToastMessage('SHARE', 'COPY_SUCCESS');
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                await navigator.clipboard.writeText(url);
                showToastMessage('SHARE', 'COPY_SUCCESS');
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
                state: { redirectReason: ACTIONS.REDIRECT.POST_DELETED }
            });
        } catch (error) {
            showToastMessage('POST', 'DELETE_ERROR');
            console.error('Error deleting post:', error);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) {
            showToastMessage('AUTH', 'LOGIN_REQUIRED');
            return;
        }

        try {
            if (isLiked) {
                await api.delete(`/blog/posts/id/${post.id}/like/`);
                setLikesCount(prevCount => prevCount - 1);
            } else {
                await api.post(`/blog/posts/id/${post.id}/like/`);
                setLikesCount(prevCount => prevCount + 1);
            }
            setIsLiked(!isLiked);
        } catch (error) {
            showToastMessage('POST', isLiked ? 'UNLIKE_ERROR' : 'LIKE_ERROR');
            console.error('Error toggling like:', error);
        }
    };

    const handleOpenReportDialog = () => {
        setReportDialogOpen(true);
    };

    const handleCloseReportDialog = () => {
        setReportDialogOpen(false);
        setSelectedReason('');
        setReportDescription('');
    };

    const handleSubmitReport = () => {
        if (!selectedReason) return;

        const formData = new FormData();
        formData.append('_action', 'reportPost');
        formData.append('reason', selectedReason);
        formData.append('description', reportDescription.trim());

        fetcher.submit(formData, { method: 'post' });
        handleCloseReportDialog();
    };

    // Handle action responses
    React.useEffect(() => {
        if (actionData?.error) {
            console.error('🔍 DEBUG: Action error:', actionData.error);
            // You can add toast notification here
        } else if (actionData?.success && actionData?.report) {
            console.log('🔍 DEBUG: Post reported successfully:', actionData);
            // You can add success toast notification here
        }
    }, [actionData]);

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
                    <Link 
                        to={`/users/${post.author?.username}`}
                        style={{ 
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}
                    >
                        <Avatar 
                            src={post.author?.profile_picture} 
                            alt={post.author?.username}
                            sx={{ 
                                width: 48, 
                                height: 48,
                                '&:hover': {
                                    opacity: 0.8
                                }
                            }}
                        />
                        <Box>
                            <Typography 
                                variant="subtitle1" 
                                fontWeight="medium"
                                sx={{ 
                                    color: 'text.primary',
                                    '&:hover': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                {post.author?.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(post.pub_date).toLocaleDateString("en-US", {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    timeZone: "UTC"
                                })}
                            </Typography>
                        </Box>
                    </Link>
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
                            aria-label={isLiked ? "Unlike post" : "Like post"}
                        >
                            <FavoriteIcon 
                                sx={{ 
                                    color: isLiked ? '#ff1744' : 'action.active',
                                    transition: 'color 0.2s ease-in-out'
                                }} 
                            />
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
                        
                        {/* Report button - always show when authenticated */}
                        {isAuthenticated && (
                            <Tooltip title={user?.id === post.author?.id ? "You can't report your own post" : "Report post"}>
                                <span>
                                    <IconButton
                                        onClick={user?.id === post.author?.id ? undefined : handleOpenReportDialog}
                                        disabled={user?.id === post.author?.id}
                                        aria-label="Report post"
                                        sx={user?.id === post.author?.id ? {
                                            color: 'action.disabled',
                                            cursor: 'not-allowed'
                                        } : { color: 'warning.main' }}
                                    >
                                        <FlagIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
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

            {/* Report Dialog */}
            <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog}>
                <DialogTitle>Report Post</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Reason</InputLabel>
                        <Select
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            label="Reason"
                        >
                            {reportReasons.map((reason) => (
                                <MenuItem key={reason.id} value={reason.id}>
                                    {reason.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Additional Details (Optional)"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseReportDialog} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmitReport}
                            disabled={!selectedReason}
                        >
                            Submit Report
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Container>
    );
}
