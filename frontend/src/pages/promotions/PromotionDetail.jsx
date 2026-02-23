import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as TradeSpendIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { DetailPageSkeleton } from '../../components/common/SkeletonLoader';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const PromotionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPromotion();
    analytics.trackPageView('promotion_detail', { promotionId: id });
  }, [id]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const response = await api.get(`/promotions/${id}`);
      setPromotion(response.data.data || response.data);
      setError(null);
      
      analytics.trackEvent('promotion_detail_loaded', {
        promotionId: id,
        loadTime: Date.now() - startTime
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load promotion details';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    analytics.trackEvent('promotion_edit_clicked', { promotionId: id });
    navigate(`/promotions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await api.delete(`/promotions/${id}`);
        analytics.trackEvent('promotion_deleted', { promotionId: id });
        toast.success('Promotion deleted successfully!');
        navigate('/promotions');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to delete promotion';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  if (loading) return <DetailPageSkeleton />;
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!promotion) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Promotion not found</Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'planned': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'default';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
              {promotion.promotionName || promotion.name}
            </Typography>
            <Box display="flex" gap={1}>
              <Chip 
                label={formatLabel(promotion.status)} 
                color={getStatusColor(promotion.status)}
                size="small"
              />
              {promotion.priority && (
                <Chip 
                  label={promotion.priority} 
                  color={getPriorityColor(promotion.priority)}
                  size="small"
                />
              )}
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/promotions')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<TradeSpendIcon />}
              onClick={() => navigate(`/trade-spends?promotionId=${id}`)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Trade Spends
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Basic Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Promotion Name
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {promotion.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Type
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatLabel(promotion.promotionType || promotion.type)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Status
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatLabel(promotion.status)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Priority
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {promotion.priority || 'Normal'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Dates
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Start Date
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {(promotion.startDate || promotion.start_date) ? new Date(promotion.startDate || promotion.start_date).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              End Date
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {(promotion.endDate || promotion.end_date) ? new Date(promotion.endDate || promotion.end_date).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Duration
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {(promotion.startDate || promotion.start_date) && (promotion.endDate || promotion.end_date)
                ? `${Math.ceil((new Date(promotion.endDate || promotion.end_date) - new Date(promotion.startDate || promotion.start_date)) / (1000 * 60 * 60 * 24))} days`
                : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Financial Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Budget
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              R {(promotion.estimatedCost || promotion.budget) ? (promotion.estimatedCost || promotion.budget).toLocaleString() : '0'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Spend
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              R {(promotion.actualCost || promotion.actualSpend) ? (promotion.actualCost || promotion.actualSpend).toLocaleString() : '0'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Remaining
            </Typography>
            <Typography 
              variant="body1" 
              fontWeight={500}
              color={promotion.budget && promotion.actualSpend && promotion.actualSpend > promotion.budget ? 'error' : 'text.primary'}
            >
              R {(promotion.estimatedCost || promotion.budget) && (promotion.actualCost || promotion.actualSpend)
                ? ((promotion.estimatedCost || promotion.budget) - (promotion.actualCost || promotion.actualSpend)).toLocaleString()
                : (promotion.estimatedCost || promotion.budget)?.toLocaleString() || '0'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              ROI
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {(promotion.roi || promotion.expectedRoi) ? `${promotion.roi || promotion.expectedRoi}%` : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Description
        </Typography>
        <Typography variant="body1">
          {promotion.description || 'No description available'}
        </Typography>
      </Paper>

      {promotion.products && promotion.products.length > 0 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Products
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {(promotion?.products || []).map((product, index) => (
              <Chip 
                key={index} 
                label={product.name || product}
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>
      )}

      {promotion.customers && promotion.customers.length > 0 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            Target Customers
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {(promotion?.customers || []).map((customer, index) => (
              <Chip 
                key={index} 
                label={customer.name || customer}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      )}

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} mb={3}>
          Metadata
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Created At
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {promotion.createdAt ? new Date(promotion.createdAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Last Updated
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {promotion.updatedAt ? new Date(promotion.updatedAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body2" color="text.secondary" mb={0.5}>
              Created By
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {promotion.createdBy?.name || promotion.createdBy || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PromotionDetail;
