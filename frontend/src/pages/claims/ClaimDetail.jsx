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
  Send as SubmitIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import claimService from '../../services/claim/claimService';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchClaimDetail();
  }, [id]);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await claimService.getById(id);
      setClaim(data);
      analytics.trackEvent('claim_detail_viewed', { claimId: id, claimType: data.claimType });
    } catch (err) {
      console.error('Error fetching claim detail:', err);
      setError(err.message || 'Failed to load claim details');
      showToast('Failed to load claim details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      await claimService.submit(id);
      showToast('Claim submitted successfully', 'success');
      analytics.trackEvent('claim_submitted', { claimId: id, claimType: claim.claimType });
      fetchClaimDetail();
    } catch (err) {
      console.error('Error submitting claim:', err);
      showToast(err.message || 'Failed to submit claim', 'error');
      analytics.trackEvent('claim_submit_failed', { claimId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await claimService.approve(id, { comments: 'Approved' });
      showToast('Claim approved successfully', 'success');
      analytics.trackEvent('claim_approved', { claimId: id, claimType: claim.claimType });
      fetchClaimDetail();
    } catch (err) {
      console.error('Error approving claim:', err);
      showToast(err.message || 'Failed to approve claim', 'error');
      analytics.trackEvent('claim_approve_failed', { claimId: id, error: err.message });
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
      await claimService.reject(id, { comments: rejectReason });
      showToast('Claim rejected', 'success');
      analytics.trackEvent('claim_rejected', { claimId: id, claimType: claim.claimType });
      setRejectDialogOpen(false);
      fetchClaimDetail();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      showToast(err.message || 'Failed to reject claim', 'error');
      analytics.trackEvent('claim_reject_failed', { claimId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'info',
      pending: 'warning',
      under_review: 'info',
      approved: 'success',
      rejected: 'error',
      paid: 'success',
      settled: 'success',
      partially_matched: 'warning',
      fully_matched: 'success'
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
      day: 'numeric'
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

  if (error || !claim) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Claim not found'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/claims')}
          variant="outlined"
        >
          Back to Claims
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
            onClick={() => navigate('/claims')}
            sx={{ mb: 1 }}
          >
            Back to Claims
          </Button>
          <Typography variant="h4" gutterBottom>
            Claim Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Claim ID: {claim.claimNumber || claim._id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={formatLabel(claim.status)}
            color={getStatusColor(claim.status)}
            size="large"
          />
          {claim.matchingStatus && (
            <Chip
                label={formatLabel(claim.matchingStatus)}
                color={getStatusColor(claim.matchingStatus)}
                size="large"
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Details Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Claim Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Claim Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatLabel(claim.claimType)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {claim.customerName || claim.customer?.name || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="primary">
                    {formatCurrency(claim.claimedAmount || claim.totalAmount)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Claim Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(claim.claimDate)}
                  </Typography>
                </Grid>

                {claim.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {claim.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Line Items */}
          {claim.lineItems && claim.lineItems.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Line Items
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Promotion</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(claim?.lineItems || []).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.promotion?.name || '-'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography variant="subtitle1" fontWeight="bold">
                            Total:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            {formatCurrency(claim.claimedAmount || claim.totalAmount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
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
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {(claim.status === 'draft' || claim.status === 'pending') && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SubmitIcon />}
                  onClick={handleSubmit}
                  disabled={actionLoading}
                  sx={{ mb: 2 }}
                >
                  Submit Claim
                </Button>
              )}

              {(claim.status === 'submitted' || claim.status === 'under_review') && (
                <>
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Matching Status Card */}
          {claim.matchingStatus && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Matching Status
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={formatLabel(claim.matchingStatus)}
                    color={getStatusColor(claim.matchingStatus)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                {claim.matchedInvoices && claim.matchedInvoices.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Matched Invoices
                    </Typography>
                    {(claim?.matchedInvoices || []).map((invoice, index) => (
                      <Typography key={index} variant="body2">
                        {invoice.invoiceNumber}
                      </Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Claim</DialogTitle>
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
            placeholder="Please provide a reason for rejecting this claim..."
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

export default ClaimDetail;
