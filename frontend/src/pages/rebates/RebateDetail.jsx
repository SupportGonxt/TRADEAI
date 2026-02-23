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
  Paper,
  Alert,
  Container,
  Skeleton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const RebateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rebate, setRebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRebateDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/rebates/${id}`);
        const data = response.data.success ? response.data.data : response.data;
        setRebate(data);
        analytics.trackEvent('rebate_detail_viewed', { rebateId: id, rebateType: data.type });
      } catch (err) {
        console.error('Error fetching rebate detail:', err);
        setError(err.message || 'Failed to load rebate details');
        showToast('Failed to load rebate details', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRebateDetail();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this rebate?')) {
      try {
        await api.delete(`/rebates/${id}`);
        showToast('Rebate deleted successfully', 'success');
        analytics.trackEvent('rebate_deleted', { rebateId: id });
        navigate('/rebates');
      } catch (err) {
        console.error('Error deleting rebate:', err);
        showToast(err.message || 'Failed to delete rebate', 'error');
        analytics.trackEvent('rebate_delete_failed', { rebateId: id, error: err.message });
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      calculating: 'info',
      inactive: 'warning',
      expired: 'error',
      pending: 'info'
    };
    return colors[status] || 'default';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'volume': 'Volume Rebate',
      'growth': 'Growth Rebate',
      'early-payment': 'Early Payment',
      'slotting': 'Slotting Fee',
      'coop': 'Co-op Marketing',
      'off-invoice': 'Off-Invoice',
      'billback': 'Bill-Back',
      'display': 'Display/Feature'
    };
    return labels[type] || formatLabel(type);
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/rebates')}
          sx={{ mt: 2 }}
        >
          Back to Rebates
        </Button>
      </Box>
    );
  }

  if (!rebate) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Rebate not found</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/rebates')}
          sx={{ mt: 2 }}
        >
          Back to Rebates
        </Button>
      </Box>
    );
  }

  return (
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            {rebate.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={getTypeLabel(rebate.type)} 
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={formatLabel(rebate.status)} 
              color={getStatusColor(rebate.status)}
              size="small"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/rebates')}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/rebates/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Rebate Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {getTypeLabel(rebate.type)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatLabel(rebate.status)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Calculation Method
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.calculation?.method || rebate.calculationType || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.description || 'No description provided'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon /> Financial Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Rate/Amount
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.calculation?.method === 'percentage' || rebate.calculationType === 'percentage'
                      ? `${rebate.calculation?.value || rebate.rate || 0}%`
                      : formatCurrency(rebate.calculation?.value || rebate.amount || 0)
                    }
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Accrued
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                    {formatCurrency(rebate.totalAccrued || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Paid
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'info.main' }}>
                    {formatCurrency(rebate.totalPaid || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Outstanding
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: 'warning.main' }}>
                    {formatCurrency((rebate.totalAccrued || 0) - (rebate.totalPaid || 0))}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Period Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Period
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(rebate.startDate || rebate.period?.startDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(rebate.endDate || rebate.period?.endDate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Frequency
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.paymentFrequency || rebate.period?.frequency || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Eligibility */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Eligibility
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Eligible Customers
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.eligibility?.customerIds?.length || 0} customers
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Eligible Products
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {rebate.eligibility?.productIds?.length || 0} products
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tiers (if applicable) */}
        {rebate.calculation?.tiers && rebate.calculation.tiers.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Rebate Tiers
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tier</TableCell>
                        <TableCell>Minimum Volume</TableCell>
                        <TableCell>Maximum Volume</TableCell>
                        <TableCell>Rate/Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(rebate?.calculation?.tiers || []).map((tier, index) => (
                        <TableRow key={index}>
                          <TableCell>Tier {index + 1}</TableCell>
                          <TableCell>{tier.minVolume?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>{tier.maxVolume?.toLocaleString() || 'Unlimited'}</TableCell>
                          <TableCell>
                            {tier.type === 'percentage' 
                              ? `${tier.value}%` 
                              : formatCurrency(tier.value)
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Metadata */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Metadata
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(rebate.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(rebate.updatedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">
                    Rebate ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {rebate.id || rebate._id}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
  );
};

export default RebateDetail;
