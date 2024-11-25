import React, { useEffect, useState, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentAlt, faEdit, faTrash, faFlag } from "@fortawesome/free-solid-svg-icons";
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
  Paper,
  CircularProgress,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import UserContext from "./contexts/UserContext";
import api from '../utils/api';
import { showToast } from '../utils/toastUtils';
import { useNavigate } from 'react-router-dom';

const BlogPostComments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const { user, isAuthenticated } = useContext(UserContext);
  
  // Report-related state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReasons, setReportReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [contentTypes, setContentTypes] = useState(null);
  const [dialog, setDialog] = useState({ open: false, title: '', content: '', actions: [] });
  const navigate = useNavigate();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchContentTypes = async () => {
    try {
      const response = await api.get('/moderation/reports/content_types/');
      if (response.status === 200) {
        setContentTypes(response.data);
        return response.data;
      }
    } catch (error) {
      showToast('error', 'Failed to fetch content types');
      return null;
    }
  };

  const fetchReportReasons = async () => {
    setLoadingReasons(true);
    try {
      const response = await api.get('/moderation/reasons/');
      if (response.status === 200) {
        const reasons = response.data;
        console.log('Received reasons:', reasons);
        setReportReasons(reasons);
        return reasons;
      }
    } catch (error) {
      showToast('error', 'Failed to fetch report reasons');
      return null;
    } finally {
      setLoadingReasons(false);
    }
  };

  const handleReportClick = async (commentId) => {
    if (!isAuthenticated) {
      setDialog({
        open: true,
        title: "Login Required",
        content: "Please log in to report this comment. We value your feedback in keeping our community safe.",
        actions: [
          {
            text: "Cancel",
            onClick: () => setDialog({ ...dialog, open: false }),
            color: "primary"
          },
          {
            text: "Login",
            onClick: () => {
              setDialog({ ...dialog, open: false });
              navigate('/login');
            },
            color: "primary",
            variant: "contained"
          }
        ]
      });
      return;
    }

    // Reset states
    setSelectedReason('');
    setReportDescription('');
    setReportingCommentId(commentId);
    
    // Fetch content types and reasons
    const types = await fetchContentTypes();
    if (!types) {
      showToast('error', 'Unable to report comment at this time');
      return;
    }
    
    const reasons = await fetchReportReasons();
    if (!reasons || !Array.isArray(reasons)) {
      showToast('error', 'Unable to load report reasons');
      return;
    }

    // Now that we have the data, show the dialog
    setDialog({
      open: true,
      title: "Report Comment",
      content: (
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Reason</InputLabel>
            <Select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              label="Reason"
            >
              {loadingReasons ? (
                <MenuItem disabled>Loading reasons...</MenuItem>
              ) : (
                reasons && reasons.map((reason) => (
                  <MenuItem key={reason.id} value={reason.id}>
                    {reason.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Details (Optional)"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
          />
        </Box>
      ),
      actions: [
        {
          text: "Cancel",
          onClick: () => {
            setDialog({ ...dialog, open: false });
            setSelectedReason('');
            setReportDescription('');
            setReportingCommentId(null);
          },
          color: "primary"
        },
        {
          text: "Submit Report",
          onClick: () => handleSubmitReport(commentId),
          color: "primary",
          variant: "contained"
        }
      ]
    });
  };

  const handleSubmitReport = async (commentId) => {
    if (!selectedReason) {
      showToast('error', 'Please select a reason for reporting');
      return;
    }

    if (!contentTypes?.comment) {
      showToast('error', 'Unable to report comment at this time');
      return;
    }

    try {
      const response = await api.post('/moderation/reports/', {
        content_type: contentTypes.comment,
        object_id: commentId,
        reason: selectedReason,
        description: reportDescription
      });
      
      if (response.status === 201) {
        showToast('success', 'Report submitted successfully');
        setDialog({ ...dialog, open: false });
      }
    } catch (error) {
      showToast('error', 'Failed to submit report');
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await api.get(`/blog/posts/id/${postId}/comments/`);
      if (response.status === 200) {
        setComments(response.data.results);
      }
    } catch (error) {
      showToast('error', 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/blog/posts/id/${postId}/comments/`, {
        content: newComment.trim()
      });
      if (response.status === 201) {
        setComments([response.data, ...comments]);
        setNewComment("");
        showToast('success', 'Comment posted successfully');
      }
    } catch (error) {
      showToast('error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const response = await api.patch(`/blog/posts/id/${postId}/comments/${commentId}/`, {
        content: editContent.trim()
      });
      if (response.status === 200) {
        setComments(comments.map(comment => 
          comment.id === commentId ? response.data : comment
        ));
        setEditingCommentId(null);
        showToast('success', 'Comment updated successfully');
      }
    } catch (error) {
      showToast('error', 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/blog/posts/id/${postId}/comments/${commentId}/`);
      setComments(comments.filter(comment => comment.id !== commentId));
      showToast('success', 'Comment deleted successfully');
    } catch (error) {
      showToast('error', 'Failed to delete comment');
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        <FontAwesomeIcon icon={faCommentAlt} /> Comments
      </Typography>

      {isAuthenticated && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <form onSubmit={handleSubmitComment}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={submitting || !newComment.trim()}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                Post Comment
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {loadingComments ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {comments.length === 0 && (
            <Box>
              <Alert severity="info">
                No comments yet. Be the first one to share your thoughts!
                {!isAuthenticated && (
                  <Box sx={{ mt: 1 }}>
                    <Link href="/login" underline="hover">Log in</Link> to leave a comment.
                  </Box>
                )}
              </Alert>
            </Box>
          )}
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar src={comment.author.avatar} alt={comment.author.username} />
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1">
                      {comment.author.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.pub_date).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    {(isAuthenticated && user && user.username === comment.author.username) && (
                      <IconButton
                        size="small"
                        onClick={() => startEditing(comment)}
                        disabled={editingCommentId === comment.id}
                        color="primary"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </IconButton>
                    )}
                    {isAuthenticated && user && (user.username === comment.author.username || user.is_staff) && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteComment(comment.id)}
                        color="error"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleReportClick(comment.id)}
                      color="warning"
                    >
                      <FontAwesomeIcon icon={faFlag} />
                    </IconButton>
                  </Box>
                </Box>
                
                {editingCommentId === comment.id ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => setEditingCommentId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body1">{comment.content}</Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      {/* Report Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })}>
        <DialogTitle>{dialog.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {dialog.content}
            {dialog.actions.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {dialog.actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    color={action.color}
                    variant={action.variant}
                  >
                    {action.text}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BlogPostComments;
