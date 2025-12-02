import React, { useState } from 'react';
import api from '../utils/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Pagination,
} from '@mui/material';
import { 
  Gavel as GavelIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ContentReport, VERDICT_CHOICES, ReportsResponse } from '../types/report';
import { User } from '../types/user';

interface ReportsListProps {
  initialData: ReportsResponse;
  user: User | null;
  onReportReviewed?: () => void;
  isRefreshing?: boolean;
}

const ReportsList: React.FC<ReportsListProps> = ({
  initialData,
  user,
  onReportReviewed,
  isRefreshing = false
}) => {
  const [reports, setReports] = useState<ContentReport[]>(initialData.results || []);

  // Update reports when initialData changes (from parent refresh)
  React.useEffect(() => {
    setReports(initialData.results || []);
  }, [initialData]);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [verdict, setVerdict] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const totalPages = Math.ceil((initialData.count || 0) / 20); // Assuming 20 per page

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'upheld_hidden':
      case 'upheld_warning':
      case 'upheld_banned':
        return 'error';
      case 'rejected':
        return 'success';
      default:
        return 'default';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'pending':
        return <ScheduleIcon />;
      case 'processing':
        return <ScheduleIcon className="animate-spin" />;
      case 'upheld_hidden':
      case 'upheld_warning':
      case 'upheld_banned':
        return <GavelIcon />;
      case 'rejected':
        return <CheckCircleIcon />;
      default:
        return <VisibilityIcon />;
    }
  };

  const handleReviewClick = (report: ContentReport) => {
    setSelectedReport(report);
    setVerdict('');
    setNote('');
    setError(null);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedReport || !verdict) {
      setError('Please select a verdict');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setProcessingStatus('Submitting review...');

    try {
      const response = await api.post(`/moderation/reports/${selectedReport.id}/review/`, {
        verdict,
        note: note || '',
      });
      
      // Handle async response
      if (response.data.task_id) {
        setProcessingTaskId(response.data.task_id);
        setProcessingStatus('Processing moderation action...');
        
        // Update the report in the local state to show processing
        setReports(prevReports =>
          prevReports.map(report =>
            report.id === selectedReport.id
              ? {
                  ...report,
                  verdict: 'processing' as any,
                  verdict_note: note,
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user ? { id: user.id, username: user.username } : undefined
                }
              : report
          )
        );

        // Start polling for task completion
        pollTaskStatus(response.data.task_id);
      } else {
        // Fallback for synchronous response
        setReports(prevReports =>
          prevReports.map(report =>
            report.id === selectedReport.id
              ? {
                  ...report,
                  verdict: verdict as any,
                  verdict_note: note,
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: user ? { id: user.id, username: user.username } : undefined
                }
              : report
          )
        );
        
        setReviewDialogOpen(false);
        onReportReviewed?.();
      }
    } catch {
      setError('Failed to submit review. Please try again.');
      setIsSubmitting(false);
      setProcessingStatus('');
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 30; // Poll for up to 30 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await api.get(`/moderation/reports/task-status/${taskId}/`);
        const { status, ready, result, error: taskError } = response.data;

        if (ready) {
          if (status === 'SUCCESS' && result?.success) {
            // Task completed successfully
            setProcessingStatus('Review completed successfully!');
            
            // Create updated report object with proper typing
            if (selectedReport) {
              const updatedReport: ContentReport = {
                ...selectedReport,
                verdict: verdict as any,
                verdict_note: note,
                reviewed_at: result.reviewed_at || new Date().toISOString(),
                reviewed_by: user ? { id: user.id, username: user.username } : undefined
              };

              // Update local state
              setReports(prevReports =>
                prevReports.map(report =>
                  report.id === selectedReport.id ? updatedReport : report
                )
              );

              // Report updated successfully in local state
            }

            setTimeout(() => {
              setReviewDialogOpen(false);
              setIsSubmitting(false);
              setProcessingTaskId(null);
              setProcessingStatus('');
              onReportReviewed?.();
            }, 1500);
          } else {
            // Task failed
            setError(taskError || result?.error || 'Review processing failed');
            setIsSubmitting(false);
            setProcessingTaskId(null);
            setProcessingStatus('');
          }
        } else {
          // Task still processing
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000); // Poll every second
          } else {
            setError('Review is taking longer than expected. Please refresh the page to check status.');
            setIsSubmitting(false);
            setProcessingTaskId(null);
            setProcessingStatus('');
          }
        }
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setError('Unable to check review status. Please refresh the page.');
          setIsSubmitting(false);
          setProcessingTaskId(null);
          setProcessingStatus('');
        }
      }
    };

    poll();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // In a real implementation, you would fetch new data here
  };

  if (!user?.is_staff) {
    return (
      <Container>
        <Alert severity="error">
          You do not have permission to view reports. Only staff members can access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Content Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage content reports from users
        </Typography>
      </Box>

      {isRefreshing && (
        <Box mb={2}>
          <Alert severity="info">
            Refreshing reports...
          </Alert>
        </Box>
      )}

      {reports.length === 0 ? (
        <Box mt={4}>
          <Alert severity="info">
            {isRefreshing ? 'Loading reports...' : 'No reports found. All content appears to be following community guidelines.'}
          </Alert>
        </Box>
      ) : (
        <>
          <Box>
            {reports.map((report) => (
              <Box key={report.id} mb={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Report #{report.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reported {formatDate(report.reported_at)}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getVerdictIcon(report.verdict)}
                        label={VERDICT_CHOICES.find(v => v.value === report.verdict)?.label || report.verdict}
                        color={getVerdictColor(report.verdict) as any}
                        variant={report.verdict === 'pending' ? 'outlined' : 'filled'}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Content Type
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {report.content_type_str}
                        </Typography>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Reported Content
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {report.reported_content_str}
                        </Typography>
                      </Grid>

                      <Grid size={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Reason
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {report.reason.name}
                        </Typography>

                        {report.description && (
                          <>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                              Description
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              {report.description}
                            </Typography>
                          </>
                        )}
                      </Grid>
                    </Grid>

                    {report.reviewed_at && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Review Details
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reviewed by {report.reviewed_by?.username} on {formatDate(report.reviewed_at)}
                          </Typography>
                          {report.verdict_note && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Note: {report.verdict_note}
                            </Typography>
                          )}
                        </Box>
                      </>
                    )}

                    {report.verdict === 'pending' && (
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<GavelIcon />}
                          onClick={() => handleReviewClick(report)}
                        >
                          Review Report
                        </Button>
                      </Box>
                    )}

                    {report.verdict === 'processing' && (
                      <Box mt={2}>
                        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ mr: 1, animation: 'spin 1s linear infinite' }} />
                          Review is being processed...
                        </Alert>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Review Report #{selectedReport?.id}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {processingStatus && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {processingStatus}
              {processingTaskId && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Task ID: {processingTaskId}
                </Typography>
              )}
            </Alert>
          )}

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Reported Content
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedReport?.reported_content_str}
            </Typography>
          </Box>

          <FormControl fullWidth margin="normal" disabled={isSubmitting}>
            <InputLabel>Verdict</InputLabel>
            <Select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value)}
              label="Verdict"
            >
              {VERDICT_CHOICES.filter(choice => choice.value !== 'pending').map((choice) => (
                <MenuItem key={choice.value} value={choice.value}>
                  {choice.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Note (Optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            margin="normal"
            placeholder="Add any additional notes about your decision..."
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReviewDialogOpen(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={isSubmitting || !verdict}
          >
            {isSubmitting
              ? (processingTaskId ? 'Processing...' : 'Submitting...')
              : 'Submit Review'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReportsList;