import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from "@remix-run/react";
import { toast } from "react-toastify";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Typography,
    styled
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import UserContext from "../contexts/UserContext";
import { REDIRECT_REASONS } from "../constants/Constants";
import { useBlogPost, type BlogPost, type BlogPostInput } from "../hooks/useBlogPost";

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
    const { fetchBlogPost, createBlogPost, updateBlogPost } = useBlogPost();
    const { postId } = useParams();
    const { user, isAuthenticated } = useContext(UserContext);

    const [post, setPost] = useState<BlogPost | null>(initialPost || null);
    const [isDraft, setIsDraft] = useState(initialPost?.is_draft ?? false);
    const [title, setTitle] = useState(initialPost?.title ?? "");
    const [content, setContent] = useState(initialPost?.content ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggleDraft = () => setIsDraft(!isDraft);

    const handleSave = async (isDraft: boolean) => {
        setIsSubmitting(true);

        if (!isAuthenticated) {
            toast.warning("You must be logged in to save this post.");
            setIsSubmitting(false);
            return;
        }

        if (postId && post && !(user?.is_staff || user?.id === post.author.id)) {
            toast.warning("You do not have permission to save this post.");
            setIsSubmitting(false);
            return;
        }

        if (!title.trim() || !content.trim()) {
            toast.warning("Please fill all fields before saving.");
            setIsSubmitting(false);
            return;
        }

        const postData: BlogPostInput = {
            title: title,
            content: content,
            is_draft: isDraft,
        };

        try {
            if (!postId) {
                const response = await createBlogPost(postData);
                navigate(`/blog/posts/${response.id}`);
            } else {
                await updateBlogPost(Number(postId), postData);
                navigate(`/blog/posts/${postId}`);
            }
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error('An error occurred while saving the post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (previousPath) {
            navigate(previousPath);
        } else if (postId) {
            navigate(`/blog/posts/${postId}`);
        } else {
            navigate('/blog');
        }
    };

    useEffect(() => {
        const fetchPostForEditing = async () => {
            if (postId && !initialPost) {
                try {
                    const fetchedPost = await fetchBlogPost(postId);
                    if (!isAuthenticated) {
                        navigate("/login", { state: { reason: REDIRECT_REASONS.EDIT_POST } });
                        return;
                    }

                    if (user?.is_staff || user?.id === fetchedPost.author.id) {
                        setPost(fetchedPost);
                        setTitle(fetchedPost.title);
                        setContent(fetchedPost.content);
                        setIsDraft(fetchedPost.is_draft ?? false);
                    } else {
                        navigate("/login", { state: { reason: REDIRECT_REASONS.EDIT_POST } });
                    }
                } catch (error) {
                    console.error("Failed to fetch post for editing:", error);
                    toast.error("Failed to load the post for editing.");
                }
            }
        };

        fetchPostForEditing();
    }, [postId, fetchBlogPost, user, navigate, isAuthenticated, initialPost]);

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
                            />
                        }
                        label="Draft"
                    />
                    <Button
                        variant={isSubmitting ? 'text' : 'contained'}
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(isDraft)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
            <TextField
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
                label="Content"
                fullWidth
                multiline
                rows={15}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
        </StyledBox>
    );
};

export default BlogPostForm;
