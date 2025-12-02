import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from "react-toastify";
import slugify from "slugify";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Typography,
    styled,
    Alert,
    LinearProgress,
    Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import UserContext from "../contexts/UserContext";
import { useBlogPost, type BlogPost, type BlogPostInput } from "../hooks/useBlogPost";
import { TOAST_MESSAGES } from "../constants/toastMessages";

interface BlogPostFormProps {
    previousPath?: string;
    initialPost?: BlogPost;
}

const StyledBox = styled(Box)(({ theme }) => ({
    '& .MuiTextField-root': {
        marginBottom: theme.spacing(2),
    },
    '& .MuiButton-root': {
        marginLeft: theme.spacing(1),
    },
}));

const BlogPostForm: React.FC<BlogPostFormProps> = ({ previousPath, initialPost }) => {
    const navigate = useNavigate();
    const { fetchBlogPost, createBlogPost, updateBlogPost, pollTaskCompletion } = useBlogPost();
    const { postId } = useParams();
    const { user } = useContext(UserContext);

    const [post, setPost] = useState<BlogPost | null>(initialPost || null);
    const [isDraft, setIsDraft] = useState(initialPost?.is_draft ?? false);
    const [title, setTitle] = useState(initialPost?.title ?? "");
    const [content, setContent] = useState(initialPost?.content ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [taskId, setTaskId] = useState<string>('');

    const isAdminEditingOthersPost = user?.is_staff && post?.author?.id !== user?.id;

    const handleToggleDraft = () => setIsDraft(!isDraft);

    const handleSave = async (isDraft: boolean) => {
        setIsSubmitting(true);
        setProcessingStatus('Validating...');

        if (!title.trim() || !content.trim()) {
            toast.warning(TOAST_MESSAGES.POST.VALIDATION_ERROR);
            setIsSubmitting(false);
            setProcessingStatus('');
            return;
        }

        const postData: BlogPostInput = {
            title: title,
            content: content,
            is_draft: isDraft,
        };

        try {
            if (!postId) {
                // Creating new post
                setProcessingStatus('Submitting post...');
                const taskResponse = await createBlogPost(postData);
                setTaskId(taskResponse.task_id);
                setProcessingStatus('Processing post creation...');
                
                // Poll for completion
                const completedPost = await pollTaskCompletion(
                    taskResponse.task_id,
                    'create',
                    undefined,
                    (status) => {
                        setProcessingStatus(
                            status === 'processing' ? 'Creating post...' :
                            status === 'completed' ? 'Post created successfully!' :
                            status === 'failed' ? 'Post creation failed' :
                            'Processing...'
                        );
                    }
                ) as BlogPost;
                
                const slug = slugify(completedPost.title, {
                    lower: true,
                    strict: true,
                    locale: 'vi',
                    trim: true
                });
                
                toast.success(TOAST_MESSAGES.POST.CREATE_SUCCESS);
                navigate(`/blog/posts/${completedPost.id}/${slug}`);
            } else {
                // Updating existing post
                setProcessingStatus('Submitting update...');
                const taskResponse = await updateBlogPost(Number(postId), postData);
                setTaskId(taskResponse.task_id);
                setProcessingStatus('Processing post update...');
                
                // Poll for completion
                const updatedPost = await pollTaskCompletion(
                    taskResponse.task_id,
                    'update',
                    Number(postId),
                    (status) => {
                        setProcessingStatus(
                            status === 'processing' ? 'Updating post...' :
                            status === 'completed' ? 'Post updated successfully!' :
                            status === 'failed' ? 'Post update failed' :
                            'Processing...'
                        );
                    }
                ) as BlogPost;
                
                const slug = slugify(updatedPost.title, {
                    lower: true,
                    strict: true,
                    locale: 'vi',
                    trim: true
                });
                
                toast.success(TOAST_MESSAGES.POST.UPDATE_SUCCESS);
                navigate(`/blog/posts/${postId}/${slug}`);
            }
        } catch (error) {
            console.error("Error saving post:", error);
            const errorMessage = !postId ? TOAST_MESSAGES.POST.CREATE_ERROR : TOAST_MESSAGES.POST.UPDATE_ERROR;
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
            setProcessingStatus('');
            setTaskId('');
        }
    };

    const handleCancel = () => {
        if (previousPath) {
            navigate(previousPath);
        } else if (postId && post?.title) {
            const slug = slugify(post.title, {
                lower: true,
                strict: true,
                locale: 'vi',
                trim: true
            });
            navigate(`/blog/posts/${postId}/${slug}`);
        } else {
            navigate('/blog');
        }
    };

    useEffect(() => {
        const fetchPostForEditing = async () => {
            if (postId && !initialPost) {
                try {
                    const fetchedPost = await fetchBlogPost(postId);
                    setPost(fetchedPost);
                    setTitle(fetchedPost.title);
                    setContent(fetchedPost.content);
                    setIsDraft(fetchedPost.is_draft ?? false);
                } catch (error) {
                    console.error("Failed to fetch post for editing:", error);
                    toast.error(TOAST_MESSAGES.POST.LOAD_ERROR);
                }
            }
        };

        fetchPostForEditing();
    }, [postId, fetchBlogPost, initialPost]);

    return (
        <StyledBox>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {initialPost ? "Edit Post" : "New Post"}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isDraft}
                                onChange={handleToggleDraft}
                                color="primary"
                                disabled={isSubmitting}
                            />
                        }
                        label="Draft"
                    />
                    <Button
                        variant={isSubmitting ? 'text' : 'contained'}
                        color="primary"
                        startIcon={isSubmitting ? <HourglassEmptyIcon /> : <SaveIcon />}
                        onClick={() => handleSave(isDraft)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Save'}
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
            
            {/* Processing Status */}
            {isSubmitting && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                            label={processingStatus || 'Processing...'}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                        {taskId && (
                            <Typography variant="caption" color="text.secondary">
                                Task ID: {taskId.substring(0, 8)}...
                            </Typography>
                        )}
                    </Box>
                    <LinearProgress />
                </Box>
            )}
            
            {isAdminEditingOthersPost && (
                <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                >
                    You are editing {post?.author?.username}'s post as an administrator
                </Alert>
            )}
            
            <TextField
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
            />
            <TextField
                label="Content"
                fullWidth
                multiline
                rows={15}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
            />
        </StyledBox>
    );
};

export default BlogPostForm;
