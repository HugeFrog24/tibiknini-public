import * as React from "react";
import { useFetcher, Link, useActionData } from 'react-router';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import UserContext from "../contexts/UserContext";
import type { UserContextType } from "../contexts/UserContext";
import { useComment } from "../hooks/useComment";
import { toast } from "react-toastify";
import { TOAST_MESSAGES } from "../constants/toastMessages";

interface Author {
  id: number;
  username: string;
  profile_picture?: string;
  image?: string; // Backend uses 'image' field
}

interface Comment {
  id: number;
  content: string;
  author: Author;
  created_at?: string;
  pub_date?: string; // Backend uses 'pub_date' field
}

interface ReportReason {
  id: number;
  name: string;
}

interface BlogPostCommentsProps {
  postId: number;
  comments?: Comment[];
  reportReasons?: ReportReason[];
}

export default function BlogPostComments({ postId, comments = [], reportReasons = [] }: BlogPostCommentsProps) {
  const fetcher = useFetcher();
  const actionData = useActionData() as { success?: boolean; error?: string; comment?: any; deleted?: string } | undefined;
  const { user, isAuthenticated } = React.useContext<UserContextType>(UserContext);
  const { createComment, updateComment, deleteComment, pollTaskCompletion } = useComment();
  
  // Local state for comments to enable in-place updates
  const [localComments, setLocalComments] = React.useState<Comment[]>(comments);
  
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [newComment, setNewComment] = React.useState("");
  
  // Async operation states
  const [isCreating, setIsCreating] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [deletingCommentId, setDeletingCommentId] = React.useState<number | null>(null);
  
  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState('');
  const [reportDescription, setReportDescription] = React.useState('');
  const [reportingCommentId, setReportingCommentId] = React.useState<number | null>(null);

  // Update local comments when props change
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isCreating) return;

    setIsCreating(true);
    
    try {
      // Start async comment creation
      const taskResponse = await createComment(postId, newComment.trim());
      
      // Poll for completion
      const result = await pollTaskCompletion(
        taskResponse.task_id,
        'create',
        postId,
        (status) => {
          console.log(`Comment creation status: ${status}`);
        }
      );
      
      // Add the new comment to local state
      if (result.success && result.comment_id) {
        const newCommentObj: Comment = {
          id: result.comment_id,
          content: result.content || newComment.trim(),
          author: {
            id: user?.id || 0,
            username: result.author || user?.username || 'Unknown',
            image: user?.image
          },
          pub_date: result.created_at || new Date().toISOString()
        };
        
        setLocalComments(prev => [newCommentObj, ...prev]);
      }
      
      // Clear the input and show success message
      setNewComment("");
      toast.success(TOAST_MESSAGES.COMMENT?.CREATE_SUCCESS || 'Comment created successfully!');
      
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(TOAST_MESSAGES.COMMENT?.CREATE_ERROR || 'Failed to create comment');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle action responses
  React.useEffect(() => {
    if (actionData?.error) {
      console.error('🔍 DEBUG: Action error:', actionData.error);
      // You can add toast notification here
    } else if (actionData?.success) {
      console.log('🔍 DEBUG: Action success:', actionData);
      // You can add success toast notification here
    }
  }, [actionData]);

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editContent.trim() || !editingCommentId || isUpdating) return;

    setIsUpdating(true);
    
    try {
      // Start async comment update
      const taskResponse = await updateComment(postId, editingCommentId, editContent.trim());
      
      // Poll for completion
      const result = await pollTaskCompletion(
        taskResponse.task_id,
        'update',
        postId,
        (status) => {
          console.log(`Comment update status: ${status}`);
        }
      );
      
      // Update the comment in local state
      if (result.success && result.comment_id) {
        setLocalComments(prev =>
          prev.map(comment =>
            comment.id === editingCommentId
              ? { ...comment, content: result.content || editContent.trim() }
              : comment
          )
        );
      }
      
      // Clear editing state and show success message
      setEditingCommentId(null);
      setEditContent("");
      toast.success(TOAST_MESSAGES.COMMENT?.UPDATE_SUCCESS || 'Comment updated successfully!');
      
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(TOAST_MESSAGES.COMMENT?.UPDATE_ERROR || 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setDeletingCommentId(commentId);
    
    try {
      // Start async comment deletion
      const taskResponse = await deleteComment(postId, commentId);
      
      // Poll for completion
      const result = await pollTaskCompletion(
        taskResponse.task_id,
        'delete',
        postId,
        (status) => {
          console.log(`Comment deletion status: ${status}`);
        }
      );
      
      // Remove the comment from local state
      if (result.success) {
        setLocalComments(prev => prev.filter(comment => comment.id !== commentId));
      }
      
      // Show success message
      toast.success(TOAST_MESSAGES.COMMENT?.DELETE_SUCCESS || 'Comment deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(TOAST_MESSAGES.COMMENT?.DELETE_ERROR || 'Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleOpenReportDialog = (commentId: number) => {
    setReportingCommentId(commentId);
    setReportDialogOpen(true);
  };

  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
    setReportingCommentId(null);
    setSelectedReason('');
    setReportDescription('');
  };

  const handleSubmitReport = () => {
    if (!selectedReason || !reportingCommentId) return;

    const formData = new FormData();
    formData.append('_action', 'reportComment');
    formData.append('commentId', reportingCommentId.toString());
    formData.append('reason', selectedReason);
    formData.append('description', reportDescription.trim());

    fetcher.submit(formData, { method: 'post' });
    handleCloseReportDialog();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Comments ({Array.isArray(localComments) ? localComments.length : 0})
      </Typography>

      {isAuthenticated ? (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isCreating}
          />
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isCreating}
              startIcon={isCreating ? <CircularProgress size={16} /> : undefined}
            >
              {isCreating ? 'Creating...' : 'Post Comment'}
            </Button>
            {isCreating && (
              <Typography variant="caption" color="text.secondary">
                Processing your comment...
              </Typography>
            )}
          </Box>
          {isCreating && <LinearProgress sx={{ mt: 1 }} />}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please <Link to="/login">log in</Link> to post comments.
        </Typography>
      )}

      <Stack spacing={2}>
        {Array.isArray(localComments) && localComments.map((comment) => (
          <Card key={comment.id}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={comment.author?.profile_picture || comment.author?.image}
                  alt={comment.author?.username}
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
                <Box>
                  <Typography variant="subtitle2">
                    {comment.author?.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.created_at || comment.pub_date || '').toLocaleDateString("en-US", {
                      timeZone: "UTC"
                    })}
                  </Typography>
                </Box>
              </Box>

              {editingCommentId === comment.id ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleUpdateComment}
                    disabled={!editContent.trim() || isUpdating}
                    size="small"
                    sx={{ mr: 1 }}
                    startIcon={isUpdating ? <CircularProgress size={16} /> : undefined}
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => setEditingCommentId(null)}
                    size="small"
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  {isUpdating && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      Processing update...
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2">{comment.content}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    {isAuthenticated && user?.id === comment.author?.id && (
                      <>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditComment(comment)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                        >
                          {deletingCommentId === comment.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </>
                    )}
                    {isAuthenticated && (
                      <Tooltip title={user?.id === comment.author?.id ? "You can't report your own comment" : "Report comment"}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={user?.id === comment.author?.id}
                            onClick={user?.id === comment.author?.id ? undefined : () => handleOpenReportDialog(comment.id)}
                            sx={user?.id === comment.author?.id ? {
                              color: 'action.disabled',
                              cursor: 'not-allowed'
                            } : {}}
                          >
                            <FlagIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={reportDialogOpen} onClose={handleCloseReportDialog}>
        <DialogTitle>Report Comment</DialogTitle>
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
    </Box>
  );
}
