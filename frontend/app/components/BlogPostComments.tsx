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
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import UserContext from "../contexts/UserContext";
import type { UserContextType } from "../contexts/UserContext";

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
  
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editContent, setEditContent] = React.useState("");
  const [newComment, setNewComment] = React.useState("");
  
  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = React.useState(false);
  const [selectedReason, setSelectedReason] = React.useState('');
  const [reportDescription, setReportDescription] = React.useState('');
  const [reportingCommentId, setReportingCommentId] = React.useState<number | null>(null);

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    console.log('🔍 DEBUG: Starting comment submission');
    console.log('🔍 DEBUG: Post ID:', postId);
    console.log('🔍 DEBUG: Comment content:', newComment.trim());
    console.log('🔍 DEBUG: Current URL:', window.location.href);
    console.log('🔍 DEBUG: Will submit to current route action function');

    const formData = new FormData();
    formData.append('_action', 'create');
    formData.append('content', newComment.trim());

    console.log('🔍 DEBUG: FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`🔍 DEBUG: ${key}: ${value}`);
    }

    console.log('🔍 DEBUG: Submitting via fetcher.submit() to route action');
    fetcher.submit(formData, { method: 'post' });
    setNewComment("");
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

  const handleUpdateComment = () => {
    if (!editContent.trim() || !editingCommentId) return;

    const formData = new FormData();
    formData.append('_action', 'update');
    formData.append('commentId', editingCommentId.toString());
    formData.append('content', editContent.trim());

    fetcher.submit(formData, { method: 'post' });
    setEditingCommentId(null);
    setEditContent("");
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const formData = new FormData();
      formData.append('_action', 'delete');
      formData.append('commentId', commentId.toString());

      fetcher.submit(formData, { method: 'post' });
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
        Comments ({Array.isArray(comments) ? comments.length : 0})
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
          Please <Link to="/login">log in</Link> to post comments.
        </Typography>
      )}

      <Stack spacing={2}>
        {Array.isArray(comments) && comments.map((comment) => (
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
                          color="primary"
                          onClick={() => handleEditComment(comment)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <DeleteIcon fontSize="small" />
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
