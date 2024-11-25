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
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import UserContext from "./contexts/UserContext";
import api from '../utils/api';
import { showToast } from '../utils/toastUtils';

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

  useEffect(() => {
    fetchComments();
    // Fetch content types once when component mounts
    fetchContentTypes();
  }, [postId]);

  useEffect(() => {
    // Fetch report reasons when the report dialog is opened
    if (reportDialogOpen && reportReasons.length === 0) {
      fetchReportReasons();
    }
  }, [reportDialogOpen]);

  const fetchContentTypes = async () => {
    try {
      const response = await api.get('/moderation/reports/content_types/');
      if (response.status === 200) {
        setContentTypes(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch content types:', error);
    }
  };

  const fetchReportReasons = async () => {
    setLoadingReasons(true);
    try {
      const response = await api.get('/moderation/reasons/');
      if (response.status === 200) {
        // Ensure we're setting an array, even if empty
        setReportReasons(response.data.results || []);
        console.log('Report reasons:', response.data); // Debug log
      }
    } catch (error) {
      console.error('Failed to load report reasons:', error);
      showToast('error', 'Failed to load report reasons');
      setReportReasons([]); // Set empty array on error
    } finally {
      setLoadingReasons(false);
    }
  };

  const handleReportClick = (commentId) => {
    if (!contentTypes) {
      showToast('error', 'Unable to report comment at this time');
      return;
    }
    setReportingCommentId(commentId);
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async () => {
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
        object_id: reportingCommentId,
        reason: selectedReason,
        description: reportDescription
      });
      
      if (response.status === 201) {
        showToast('success', 'Report submitted successfully');
        handleReportDialogClose();
      }
    } catch (error) {
      showToast('error', 'Failed to submit report');
    }
  };

  const handleReportDialogClose = () => {
    setReportDialogOpen(false);
    setSelectedReason('');
    setReportDescription('');
    setReportingCommentId(null);
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
                  {isAuthenticated && user && (user.username === comment.author.username || user.is_staff) && (
                    <Box sx={{ ml: 'auto' }}>
                      <IconButton
                        size="small"
                        onClick={() => startEditing(comment)}
                        disabled={editingCommentId === comment.id}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteComment(comment.id)}
                        color="error"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </IconButton>
                    </Box>
                  )}
                  {isAuthenticated && user && user.username !== comment.author.username && (
                    <Box sx={{ ml: 'auto' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleReportClick(comment.id)}
                        color="warning"
                      >
                        <FontAwesomeIcon icon={faFlag} />
                      </IconButton>
                    </Box>
                  )}
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
      <Dialog open={reportDialogOpen} onClose={handleReportDialogClose}>
        <DialogTitle>Report Comment</DialogTitle>
        <DialogContent>
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
                  Array.isArray(reportReasons) ? reportReasons.map((reason) => (
                    <MenuItem key={reason.id} value={reason.id}>
                      {reason.name}
                    </MenuItem>
                  )) : (
                    <MenuItem disabled>No reasons available</MenuItem>
                  )
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReportDialogClose}>Cancel</Button>
          <Button onClick={handleReportSubmit} color="primary" variant="contained">
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlogPostComments;
