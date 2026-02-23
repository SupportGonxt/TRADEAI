import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  Skeleton
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ArrowBack as BackIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';
import approvalService from '../../services/approval/approvalService';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const ApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApprovalDetail();
  }, [id]);

  const fetchApprovalDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await approvalService.getById(id);
      setApproval(data);
      analytics.trackEvent('approval_detail_viewed', { approvalId: id, requestType: data.requestType });
    } catch (err) {
      console.error('Error fetching approval detail:', err);
      setError(err.message || 'Failed to load approval details');
      showToast('Failed to load approval details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approvalService.approve(id, { comments: 'Approved' });
      showToast('Approval request approved successfully', 'success');
      analytics.trackEvent('approval_approved', { approvalId: id, requestType: approval.requestType });
      navigate('/approvals');
    } catch (err) {
      console.error('Error approving request:', err);
      showToast(err.message || 'Failed to approve request', 'error');
      analytics.trackEvent('approval_approve_failed', { approvalId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejection', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await approvalService.reject(id, { comments: rejectReason });
      showToast('Approval request rejected', 'success');
      analytics.trackEvent('approval_rejected', { approvalId: id, requestType: approval.requestType });
      setRejectDialogOpen(false);
      navigate('/approvals');
    } catch (err) {
      console.error('Error rejecting request:', err);
      showToast(err.message || 'Failed to reject request', 'error');
      analytics.trackEvent('approval_reject_failed', { approvalId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      overdue: 'error'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  if (error || !approval) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Approval not found'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/approvals')}
          variant="outlined"
        >
          Back to Approvals
        </Button>
      </Box>
    );
  }

  return (
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/approvals')}
            sx={{ mb: 1 }}
          >
            Back to Approvals
          </Button>
          <Typography variant="h4" gutterBottom>
            Approval Request Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Request ID: {approval.id || approval._id}
          </Typography>
        </Box>
        <Chip
          label={formatLabel(approval.status)}
          color={getStatusColor(approval.status)}
          size="large"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Main Details Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Request Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatLabel(approval.requestType)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(approval.amount)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Requested By
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {typeof approval.requestedBy === 'object' ? `${approval.requestedBy?.firstName || ''} ${approval.requestedBy?.lastName || ''}`.trim() : (approval.requestedByName || approval.requestedBy || 'N/A')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Requested Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(approval.createdAt)}
                  </Typography>
                </Grid>

                {approval.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {approval.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Approval Chain */}
          {approval.approvalChain && approval.approvalChain.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Approval Chain
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Level</TableCell>
                        <TableCell>Approver</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Comments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(approval?.approvalChain || []).map((step, index) => (
                        <TableRow key={index}>
                          <TableCell>{step.level}</TableCell>
                          <TableCell>
                            {typeof step.approver === 'object' ? `${step.approver?.firstName || ''} ${step.approver?.lastName || ''}`.trim() : (step.approverName || step.approver || 'N/A')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatLabel(step.status)}
                              color={getStatusColor(step.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(step.actionDate)}</TableCell>
                          <TableCell>{step.comments || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Actions Card */}
          {approval.status === 'pending' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={handleApprove}
                  disabled={actionLoading}
                  sx={{ mb: 2 }}
                >
                  Approve
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SLA Tracking Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SLA Tracking
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ClockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    SLA Duration
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {approval.slaDuration || 'N/A'} hours
                  </Typography>
                </Box>
              </Box>

              {approval.slaDeadline && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ClockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      SLA Deadline
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(approval.slaDeadline)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Approval Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this request..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={actionLoading || !rejectReason.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
  );
};

export default ApprovalDetail;
