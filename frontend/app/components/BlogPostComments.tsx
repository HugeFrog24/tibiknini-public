import * as React from "react";
import { toast } from 'react-toastify';
import {
    Box,
    Typography,
    TextField,
    Button,
    Avatar,
    Paper,
    Divider
} from '@mui/material';
import UserContext, { type UserContextType } from "../contexts/UserContext";

interface Comment {
    id: number;
    content: string;
    author: {
        id: number;
        username: string;
        profile_picture?: string;
    };
    created_at: string;
    pinned: boolean;
    hidden: boolean;
}

interface BlogPostCommentsProps {
    postId: number;
}

export default function BlogPostComments({ postId }: BlogPostCommentsProps) {
    const { isAuthenticated } = React.useContext<UserContextType>(UserContext);
    const [comments, setComments] = React.useState<Comment[]>([]);
    const [newComment, setNewComment] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const fetchComments = React.useCallback(async () => {
        try {
            const response = await fetch(`/api/blog/posts/id/${postId}/comments/`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        }
    }, [postId]);

    React.useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please log in to comment');
            return;
        }

        if (!newComment.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/blog/posts/id/${postId}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ content: newComment }),
            });

            if (!response.ok) throw new Error('Failed to post comment');

            await fetchComments();
            setNewComment("");
            toast.success('Comment posted successfully');
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 3, my: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Comments
            </Typography>

            {isAuthenticated && (
                <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 4 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        sx={{ float: 'right' }}
                    >
                        {isLoading ? 'Posting...' : 'Post Comment'}
                    </Button>
                </Box>
            )}

            <Box sx={{ mt: 4 }}>
                {comments.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                        No comments yet. Be the first to comment!
                    </Typography>
                ) : (
                    comments.map((comment) => (
                        !comment.hidden && (
                            <Box key={comment.id} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                    <Avatar
                                        src={comment.author.profile_picture}
                                        alt={comment.author.username}
                                    />
                                    <Box>
                                        <Typography variant="subtitle2">
                                            {comment.author.username}
                                            {comment.pinned && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    sx={{
                                                        ml: 1,
                                                        color: 'primary.main',
                                                        fontWeight: 'medium'
                                                    }}
                                                >
                                                    (Pinned)
                                                </Typography>
                                            )}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(comment.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ ml: 7 }}>
                                    {comment.content}
                                </Typography>
                                {comments.length > 1 && <Divider sx={{ mt: 2 }} />}
                            </Box>
                        )
                    ))
                )}
            </Box>
        </Paper>
    );
}
