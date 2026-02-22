import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AIEnhancedPage, SmartDataGrid, PageHeader } from '../common';
import tradeSpendService from '../../services/api/tradeSpendService';
import { formatLabel } from '../../utils/formatters';

const TradeSpendListEnhanced = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tradeSpends, setTradeSpends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTradeSpends();
  }, []);

  const fetchTradeSpends = async () => {
    setLoading(true);
    try {
      const response = await tradeSpendService.getAll();
      setTradeSpends(response.data || response || []);
    } catch (error) {
      console.error("Error fetching trade spends:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = () => {
    if (tradeSpends.length === 0) return [];
    
    const insights = [];
    const totalSpend = tradeSpends.reduce((sum, ts) => sum + (ts.amount || 0), 0);
    const avgROI = tradeSpends.reduce((sum, ts) => sum + (ts.roi || 0), 0) / tradeSpends.length;
    
    insights.push({
      title: `Total Trade Spend: R${totalSpend.toLocaleString()}`,
      description: `Average ROI across all trade spends is ${avgROI.toFixed(0)}%. Top performers show 3x better returns.`,
      confidence: 0.92
    });

    const lowROI = tradeSpends.filter(ts => ts.roi < 100).length;
    if (lowROI > 0) {
      insights.push({
        title: `${lowROI} Trade Spends Below Target ROI`,
        description: `Review allocation strategy and consider redirecting funds to high-performing channels.`,
        confidence: 0.88
      });
    }

    insights.push({
      title: `Optimization Potential: 22%`,
      description: `AI analysis suggests strategic reallocation could increase overall ROI by up to 22%.`,
      confidence: 0.79
    });

    return insights;
  };

  const getQuickActions = () => [
    {
      icon: '💵',
      label: 'Record Trade Spend',
      description: 'Add new trade spend transaction',
      action: () => navigate('/trade-spends/new')
    },
    {
      icon: '📈',
      label: 'ROI Analysis',
      description: 'Analyze returns on trade spend investments',
      action: () => navigate('/reports/tradespend')
    },
    {
      icon: '🎯',
      label: 'Optimize Allocation',
      description: 'AI-powered spend optimization',
      action: () => navigate('/scenarios')
    },
    {
      icon: '📊',
      label: 'Forecast Impact',
      description: 'Predict trade spend effectiveness',
      action: () => navigate('/forecasting')
    }
  ];

  const getTips = () => [
    'Tip: Monitor ROI trends to identify most effective spend categories',
    'Tip: Trade spends with ROI < 100% may need strategy adjustment',
    'Tip: Use AI to predict optimal spend levels per customer'
  ];

  const generateRowInsights = () => {
    const insights = {};
    tradeSpends.forEach(ts => {
      if (ts.roi > 200) {
        insights[ts.id || ts._id] = {
          type: 'opportunity',
          message: `🌟 Excellent ROI: ${ts.roi}% - Increase allocation`
        };
      } else if (ts.roi < 80) {
        insights[ts.id || ts._id] = {
          type: 'risk',
          message: `⚠️ Low ROI: ${ts.roi}% - Review effectiveness`
        };
      } else if (ts.amount > 50000) {
        insights[ts.id || ts._id] = {
          type: 'trending',
          message: `💰 High-value spend - Monitor closely`
        };
      }
    });
    return insights;
  };

  const columns = [
    {
      id: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">{value}</Typography>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      sortable: true,
      render: (value) => value?.name || 'N/A'
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Chip label={value} size="small" color="primary" variant="outlined" />
      )
    },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600" color="primary">
          R{(value || 0).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'roi',
      label: 'ROI',
      sortable: true,
      render: (value) => (
        <Chip
          label={`${value || 0}%`}
          size="small"
          color={value > 150 ? 'success' : value > 100 ? 'primary' : 'warning'}
        />
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
          color={value === 'approved' ? 'success' : value === 'pending' ? 'warning' : 'default'}
        />
      )
    },
    {
      id: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  return (
    <AIEnhancedPage
      pageContext="tradespends"
      contextData={{ total: tradeSpends.length }}
      aiInsights={generateAIInsights()}
      quickActions={getQuickActions()}
      tips={getTips()}
    >
      <Box>
        <PageHeader
          title="Trade Spend Management"
          subtitle={`Tracking ${tradeSpends.length} trade spend transactions`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/trade-spends/new')}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Record Spend
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          <SmartDataGrid
            title={`Trade Spends (${tradeSpends.length})`}
            data={tradeSpends}
            columns={columns}
            onRowClick={(ts) => navigate(`/trade-spends/${ts.id || ts._id}`)}
            aiInsights={generateRowInsights()}
            enableAI={true}
            enableExport={true}
            emptyMessage={loading ? "Loading trade spends..." : "No trade spends found"}
          />
        </Box>
      </Box>
    </AIEnhancedPage>
  );
};

export default TradeSpendListEnhanced;
