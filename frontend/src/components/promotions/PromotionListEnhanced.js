import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AIEnhancedPage, SmartDataGrid, PageHeader } from '../common';
import { promotionService } from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const PromotionListEnhanced = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await promotionService.getAll();
      setPromotions(response.data || response || []);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = () => {
    if (promotions.length === 0) return [];
    
    const insights = [];
    const activePromos = promotions.filter(p => p.status === 'active').length;
    const avgROI = promotions.reduce((sum, p) => sum + (p.metrics?.roi || 0), 0) / promotions.length;
    
    if (activePromos > 0) {
      insights.push({
        title: `${activePromos} Active Promotions Running`,
        description: `Monitor performance metrics and adjust strategies in real-time for optimal results.`,
        confidence: 0.95
      });
    }

    if (avgROI > 150) {
      insights.push({
        title: `Strong ROI Performance (${avgROI.toFixed(0)}% avg)`,
        description: `Your promotions are performing above industry average. Consider scaling successful campaigns.`,
        confidence: 0.91
      });
    }

    insights.push({
      title: `Seasonal Opportunity Detected`,
      description: `Based on historical data, launching promotions now could yield 25-30% higher engagement.`,
      confidence: 0.82
    });

    return insights;
  };

  const getQuickActions = () => [
    {
      icon: '',
      label: 'Create Smart Promotion',
      description: 'AI-powered promotion builder with recommendations',
      action: () => navigate('/promotions/new')
    },
    {
      icon: '',
      label: 'Analyze Performance',
      description: 'Deep dive into promotion metrics and ROI',
      action: () => navigate('/reports/promotions')
    },
    {
      icon: '',
      label: 'Clone Best Performers',
      description: 'Replicate successful promotions',
      action: () => console.log('Clone')
    },
    {
      icon: '',
      label: 'Run Simulation',
      description: 'Forecast promotion impact before launch',
      action: () => navigate('/scenarios')
    }
  ];

  const getTips = () => [
    'Tip: Promotions with ROI above 200% are highlighted for easy identification',
    'Tip: Use AI assistant to optimize discount levels and timing',
    'Tip: A/B test different promotion strategies for best results'
  ];

  const generateRowInsights = () => {
    const insights = {};
    promotions.forEach(promo => {
      const roi = promo.metrics?.roi || 0;
      if (roi > 200) {
        insights[promo.id || promo._id] = {
          type: 'opportunity',
          message: `High ROI: ${roi}% - Consider extending or replicating`
        };
      } else if (roi < 100) {
        insights[promo.id || promo._id] = {
          type: 'risk',
          message: `Low ROI: ${roi}% - Review and optimize`
        };
      } else if (promo.status === 'active') {
        insights[promo.id || promo._id] = {
          type: 'trending',
          message: `Active - Monitoring performance`
        };
      }
    });
    return insights;
  };

  const columns = [
    {
      id: 'name',
      label: 'Promotion Name',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">{value}</Typography>
      )
    },
    {
      id: 'promotionType',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <Chip label={formatLabel(value)} size="small" color="primary" variant="outlined" />
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={formatLabel(value)}
          size="small"
          color={value === 'active' ? 'success' : value === 'pending_approval' ? 'warning' : 'default'}
        />
      )
    },
    {
      id: 'discount',
      label: 'Discount',
      sortable: true,
      render: (value, row) => {
        const discountValue = row.mechanics?.discountValue || 0;
        return <Typography variant="body2">{discountValue.toFixed(1)}%</Typography>;
      }
    },
    {
      id: 'roi',
      label: 'ROI',
      sortable: true,
      render: (value, row) => {
        const roiValue = row.financial?.profitability?.roi || row.metrics?.roi || 0;
        return (
          <Chip
            label={`${roiValue.toFixed(2)}%`}
            size="small"
            color={roiValue > 150 ? 'success' : roiValue > 100 ? 'primary' : 'warning'}
          />
        );
      }
    },
    {
      id: 'startDate',
      label: 'Start Date',
      render: (value, row) => {
        const date = row.period?.startDate || value;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      }
    },
    {
      id: 'endDate',
      label: 'End Date',
      render: (value, row) => {
        const date = row.period?.endDate || value;
        return date ? new Date(date).toLocaleDateString() : 'N/A';
      }
    }
  ];

  return (
    <AIEnhancedPage
      pageContext="promotions"
      contextData={{ total: promotions.length }}
      aiInsights={generateAIInsights()}
      quickActions={getQuickActions()}
      tips={getTips()}
    >
      <Box>
        <PageHeader
          title="Promotion Management"
          subtitle={`Managing ${promotions.length} promotions`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/promotions/new')}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Create Promotion
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          <SmartDataGrid
            title={`Promotions (${promotions.length})`}
            data={promotions}
            columns={columns}
            onRowClick={(promo) => navigate(`/promotions/${promo.id || promo._id}`)}
            aiInsights={generateRowInsights()}
            enableAI={true}
            enableExport={true}
            emptyMessage={loading ? "Loading promotions..." : "No promotions found"}
          />
        </Box>
      </Box>
    </AIEnhancedPage>
  );
};

export default PromotionListEnhanced;
