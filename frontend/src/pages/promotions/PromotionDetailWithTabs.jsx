import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Chip,
  Skeleton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { usePageVariants } from '../../hooks/usePageVariants';

import PromotionOverview from './tabs/PromotionOverview';
import PromotionProducts from './tabs/PromotionProducts';
import PromotionCustomers from './tabs/PromotionCustomers';
import PromotionBudget from './tabs/PromotionBudget';
import PromotionApprovals from './tabs/PromotionApprovals';
import PromotionDocuments from './tabs/PromotionDocuments';
import PromotionConflicts from './tabs/PromotionConflicts';
import PromotionPerformance from './tabs/PromotionPerformance';
import PromotionHistory from './tabs/PromotionHistory';

if (typeof window !== 'undefined') {
  window.__TABS_V2_IMPORTED__ = true;
  console.info('PromotionDetailWithTabs module loaded');
}

const PromotionDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const pageVariant = usePageVariants('promotionDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'products', label: 'Products', path: 'products' },
    { id: 'customers', label: 'Customers', path: 'customers' },
    { id: 'budget', label: 'Budget', path: 'budget' },
    { id: 'approvals', label: 'Approvals', path: 'approvals' },
    { id: 'documents', label: 'Documents', path: 'documents' },
    { id: 'conflicts', label: 'Conflicts', path: 'conflicts' },
    { id: 'performance', label: 'Performance', path: 'performance' },
    { id: 'history', label: 'History', path: 'history' }
  ];

  useEffect(() => {
    loadPromotion();
    analytics.trackPageView('promotion_detail', { promotionId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadPromotion = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${id}`);
      setPromotion(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading promotion:', error);
      toast.error('Failed to load promotion');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/promotions/${id}/${newValue}`);
    analytics.trackEvent('promotion_tab_changed', { promotionId: id, tab: newValue });
  };

  const handleEdit = () => {
    analytics.trackEvent('promotion_edit_clicked', { promotionId: id });
    navigate(`/promotions/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }
    try {
      await apiClient.delete(`/promotions/${id}`);
      analytics.trackEvent('promotion_deleted', { promotionId: id });
      toast.success('Promotion deleted successfully');
      navigate('/promotions');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error(error.response?.data?.message || 'Failed to delete promotion');
    }
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

  if (!promotion) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Promotion not found</Typography>
      </Container>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Modern Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/promotions')}
            sx={{ 
              mb: 2,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            Back to Promotions
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {promotion.name}
                </Typography>
                <Chip
                  label={formatLabel(promotion.status)}
                  color={
                    promotion.status === 'active' ? 'success' :
                    promotion.status === 'approved' ? 'primary' :
                    promotion.status === 'draft' ? 'default' :
                    'warning'
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                ID: {promotion.id || promotion._id || promotion.promotionId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Modern Tabs */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                minHeight: 56
              }
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === 'overview' && <PromotionOverview promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'commitments' && <PromotionBudget promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'products' && <PromotionProducts promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'customers' && <PromotionCustomers promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'trade-spends' && <PromotionDocuments promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'claims' && <PromotionApprovals promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'budget' && <PromotionBudget promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'approvals' && <PromotionApprovals promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'documents' && <PromotionDocuments promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'conflicts' && <PromotionConflicts promotionId={id} promotion={promotion} />}
          {activeTab === 'performance' && <PromotionPerformance promotionId={id} promotion={promotion} />}
          {activeTab === 'history' && <PromotionHistory promotionId={id} promotion={promotion} />}
          {activeTab === 'vendor-funding' && <PromotionBudget promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'allocation' && <PromotionCustomers promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'offer' && <PromotionOverview promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'stores' && <PromotionCustomers promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
          {activeTab === 'pos-proof' && <PromotionDocuments promotionId={id} promotion={promotion} onUpdate={loadPromotion} />}
        </Box>
      </Container>
  );
};

export default PromotionDetailWithTabs;
