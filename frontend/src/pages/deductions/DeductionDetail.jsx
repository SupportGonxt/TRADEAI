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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Container,
  Skeleton
} from '@mui/material';
import {
  CheckCircle as ValidateIcon,
  Gavel as DisputeIcon,
  CheckCircleOutline as ResolveIcon,
  ArrowBack as BackIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import deductionService from '../../services/deduction/deductionService';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const DeductionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [deduction, setDeduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchDeductionDetail();
  }, [id]);

  const fetchDeductionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deductionService.getById(id);
      setDeduction(data);
      analytics.trackEvent('deduction_detail_viewed', { deductionId: id, deductionType: data.deductionType });
    } catch (err) {
      console.error('Error fetching deduction detail:', err);
      setError(err.message || 'Failed to load deduction details');
      showToast('Failed to load deduction details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setActionLoading(true);
      await deductionService.validate(id, { notes: 'Validated' });
      showToast('Deduction validated successfully', 'success');
      analytics.trackEvent('deduction_validated', { deductionId: id, deductionType: deduction.deductionType });
      fetchDeductionDetail();
    } catch (err) {
      console.error('Error validating deduction:', err);
      showToast(err.message || 'Failed to validate deduction', 'error');
      analytics.trackEvent('deduction_validate_failed', { deductionId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      showToast('Please provide a reason for dispute', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await deductionService.dispute(id, { reason: disputeReason });
      showToast('Deduction disputed successfully', 'success');
      analytics.trackEvent('deduction_disputed', { deductionId: id, deductionType: deduction.deductionType });
      setDisputeDialogOpen(false);
      fetchDeductionDetail();
    } catch (err) {
      console.error('Error disputing deduction:', err);
      showToast(err.message || 'Failed to dispute deduction', 'error');
      analytics.trackEvent('deduction_dispute_failed', { deductionId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      showToast('Please provide resolution notes', 'warning');
      return;
    }

    try {
      setActionLoading(true);
      await deductionService.resolve(id, { notes: resolutionNotes });
      showToast('Deduction resolved successfully', 'success');
      analytics.trackEvent('deduction_resolved', { deductionId: id, deductionType: deduction.deductionType });
      setResolveDialogOpen(false);
      fetchDeductionDetail();
    } catch (err) {
      console.error('Error resolving deduction:', err);
      showToast(err.message || 'Failed to resolve deduction', 'error');
      analytics.trackEvent('deduction_resolve_failed', { deductionId: id, error: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      validated: 'info',
      disputed: 'error',
      resolved: 'success',
      matched: 'success',
      partially_matched: 'warning'
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

  if (error || !deduction) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Deduction not found'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/deductions')}
          variant="outlined"
        >
          Back to Deductions
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
            onClick={() => navigate('/deductions')}
            sx={{ mb: 1 }}
          >
            Back to Deductions
          </Button>
          <Typography variant="h4" gutterBottom>
            Deduction Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deduction ID: {deduction.deductionNumber || deduction.id || deduction._id}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={formatLabel(deduction.status)}
            color={getStatusColor(deduction.status)}
            size="large"
          />
          {deduction.matchingStatus && (
            <Chip
                            label={formatLabel(deduction.matchingStatus)}
                            color={getStatusColor(deduction.matchingStatus)}
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
                Deduction Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Deduction Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatLabel(deduction.deductionType)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {deduction.customerName || deduction.customer?.name || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="error">
                    {formatCurrency(deduction.deductionAmount || deduction.amount)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Deduction Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDate(deduction.deductionDate)}
                  </Typography>
                </Grid>

                {deduction.invoiceNumber && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Invoice Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {deduction.invoiceNumber}
                    </Typography>
                  </Grid>
                )}

                {deduction.reason && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Reason
                    </Typography>
                    <Typography variant="body1">
                      {deduction.reason}
                    </Typography>
                  </Grid>
                )}

                {deduction.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {deduction.description}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Dispute History */}
          {deduction.disputeHistory && deduction.disputeHistory.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dispute History
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <List>
                  {(deduction?.disputeHistory || []).map((dispute, index) => (
                    <ListItem key={index} divider={index < deduction.disputeHistory.length - 1}>
                      <ListItemText
                        primary={dispute.reason}
                        secondary={`${formatDate(dispute.date)} - ${typeof dispute.user === 'object' ? `${dispute.user?.firstName || ''} ${dispute.user?.lastName || ''}`.trim() : (dispute.userName || dispute.user || 'System')}`}
                      />
                    </ListItem>
                  ))}
                </List>
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

              {(deduction.status === 'pending' || deduction.status === 'open') && (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<ValidateIcon />}
                    onClick={handleValidate}
                    disabled={actionLoading}
                    sx={{ mb: 2 }}
                  >
                    Validate
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DisputeIcon />}
                    onClick={() => setDisputeDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    Dispute
                  </Button>
                </>
              )}

              {(deduction.status === 'validated' || deduction.status === 'disputed' || deduction.status === 'under_review') && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<ResolveIcon />}
                  onClick={() => setResolveDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Resolve
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Matching Status Card */}
          {deduction.matchingStatus && (
            <Card sx={{ mb: 3 }}>
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
                                        label={formatLabel(deduction.matchingStatus)}
                                        color={getStatusColor(deduction.matchingStatus)}
                                        size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                {deduction.matchedClaims && deduction.matchedClaims.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Matched Claims
                    </Typography>
                    {(deduction?.matchedClaims || []).map((claim, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LinkIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography
                          variant="body2"
                          sx={{ cursor: 'pointer', color: 'primary.main' }}
                          onClick={() => navigate(`/claims/${claim.id || claim._id}`)}
                        >
                          {claim.claimNumber}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Variance Card */}
          {deduction.variance && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Variance Analysis
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(deduction.variance.expectedAmount)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Actual Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(deduction.variance.actualAmount)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Variance
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="error">
                    {formatCurrency(deduction.variance.variance)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dispute Dialog */}
      <Dialog
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dispute Deduction</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Dispute"
            fullWidth
            multiline
            rows={4}
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Please provide a reason for disputing this deduction..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisputeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDispute}
            color="error"
            variant="contained"
            disabled={actionLoading || !disputeReason.trim()}
          >
            Dispute
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Deduction</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Notes"
            fullWidth
            multiline
            rows={4}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Please provide notes on how this deduction was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResolve}
            color="primary"
            variant="contained"
            disabled={actionLoading || !resolutionNotes.trim()}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
  );
};

export default DeductionDetail;
