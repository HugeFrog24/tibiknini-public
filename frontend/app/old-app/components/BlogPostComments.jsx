import React, { useState, useContext } from "react";
import { useFetcher, useLoaderData, Link } from "@remix-run/react";
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
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import UserContext from "./contexts/UserContext";
import { showToast } from '../utils/toastUtils';

const BlogPostComments = ({ postId }) => {
  const { comments = [], reportReasons = [] } = useLoaderData();
  const fetcher = useFetcher();
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const { user, isAuthenticated } = useContext(UserContext);
  
  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportingCommentId, setReportingCommentId] = useState(null);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    fetcher.submit(
      { 
        _action: 'create',
        content: newComment.trim(),
      },
      { method: 'post' }
    );
    setNewComment("");
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = () => {
    if (!editContent.trim()) return;

    fetcher.submit(
      {
        _action: 'update',
        commentId: editingCommentId,
        content: editContent.trim(),
      },
      { method: 'post' }
    );
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      fetcher.submit(
        {
          _action: 'delete',
          commentId: commentId,
        },
        { method: 'post' }
      );
    }
  };

  const handleOpenReportDialog = (commentId) => {
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
    if (!selectedReason) return;

    fetcher.submit(
      {
        _action: 'report',
        commentId: reportingCommentId,
        reason: selectedReason,
        description: reportDescription.trim(),
      },
      { method: 'post' }
    );
    handleCloseReportDialog();
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Comments ({(comments || []).length})
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
          />
          <Button
            variant="contained"
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            sx={{ mt: 1 }}
          >
            Post Comment
          </Button>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please <Link href="/login">log in</Link> to post comments.
        </Typography>
      )}

      <Stack spacing={2}>
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={comment.author?.profile_picture}
                  alt={comment.author?.username}
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
                <Box>
                  <Typography variant="subtitle2">
                    {comment.author?.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(comment.created_at).toLocaleDateString()}
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
                    disabled={!editContent.trim()}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingCommentId(null)}
                    size="small"
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2">{comment.content}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    {isAuthenticated && user?.id === comment.author?.id && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEditComment(comment)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    {isAuthenticated && user?.id !== comment.author?.id && (
                      <Tooltip title="Report comment">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenReportDialog(comment.id)}
                        >
                          <FlagIcon fontSize="small" />
                        </IconButton>
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
};

export default BlogPostComments;
