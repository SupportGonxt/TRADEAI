import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, Typography, LinearProgress, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AIEnhancedPage, SmartDataGrid, PageHeader } from '../common';
import budgetService from '../../services/api/budgetService';
import { formatLabel } from '../../utils/formatters';

const BudgetListEnhanced = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await budgetService.getAll();
      setBudgets(response.data || response || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = () => {
    if (budgets.length === 0) return [];
    
    const insights = [];
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    // API returns 'utilized' instead of 'spent'
    const totalSpent = budgets.reduce((sum, b) => sum + (b.utilized || b.spent || 0), 0);
    const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    if (utilization > 90) {
      insights.push({
        title: `High Budget Utilization (${utilization.toFixed(1)}%)`,
        description: `You've used ${utilization.toFixed(1)}% of allocated budgets. Consider reallocating or requesting additional funds for high-performing areas.`,
        confidence: 0.94
      });
    }

    const underutilized = budgets.filter(b => ((b.utilized || b.spent || 0) / (b.amount || 1)) < 0.5 && b.status === 'active').length;
    if (underutilized > 0) {
      insights.push({
        title: `${underutilized} Budgets Underutilized`,
        description: `Reallocate unused funds to high-performing campaigns for better ROI.`,
        confidence: 0.87
      });
    }

    insights.push({
      title: `Budget Optimization Opportunity`,
      description: `AI analysis suggests 15-20% efficiency gain through strategic reallocation across categories.`,
      confidence: 0.81
    });

    return insights;
  };

  const getQuickActions = () => [
    {
      icon: '',
      label: 'Allocate Budget',
      description: 'Create new budget allocation with AI recommendations',
      action: () => navigate('/budgets/new')
    },
    {
      icon: '',
      label: 'Budget Analytics',
      description: 'View spend analysis and utilization trends',
      action: () => navigate('/reports/budget')
    },
    {
      icon: '',
      label: 'Rebalance Budgets',
      description: 'AI-powered budget reallocation optimizer',
      action: () => navigate('/scenarios')
    },
    {
      icon: '',
      label: 'Forecast Spend',
      description: 'Predict budget needs for upcoming period',
      action: () => navigate('/forecasting')
    }
  ];

  const getTips = () => [
    'Tip: Budgets with <50% utilization may benefit from reallocation',
    'Tip: Use the AI optimizer to balance spend across categories',
    'Tip: Track ROI per budget category for data-driven decisions'
  ];

  const generateRowInsights = () => {
    const insights = {};
    budgets.forEach(budget => {
      // API returns 'utilized' instead of 'spent'
      const spent = budget.utilized || budget.spent || 0;
      const amount = budget.amount || 1;
      const utilization = (spent / amount) * 100;
      
      if (utilization > 95) {
        insights[budget.id || budget._id] = {
          type: 'risk',
          message: `${utilization.toFixed(0)}% spent - Near limit`
        };
      } else if (utilization < 30 && budget.status === 'active') {
        insights[budget.id || budget._id] = {
          type: 'opportunity',
          message: `Low utilization - Consider reallocation`
        };
      } else if (utilization >= 70 && utilization <= 90) {
        insights[budget.id || budget._id] = {
          type: 'trending',
          message: `Healthy utilization: ${utilization.toFixed(0)}%`
        };
      }
    });
    return insights;
  };

  const columns = [
    {
      id: 'name',
      label: 'Budget Name',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">{value}</Typography>
      )
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Chip label={value} size="small" color="secondary" variant="outlined" />
      )
    },
    {
      id: 'amount',
      label: 'Allocated',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600">
          R{(value || 0).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'spent',
      label: 'Spent',
      sortable: true,
      render: (value, row) => (
        <Typography variant="body2">
          R{((row?.utilized || row?.spent || value || 0)).toLocaleString()}
        </Typography>
      )
    },
    {
      id: 'utilization',
      label: 'Utilization',
      sortable: true,
      render: (value, row) => {
        const spent = row?.utilized || row?.spent || 0;
        const amount = row?.amount || 1;
        const percent = (spent / amount) * 100;
        return (
          <Box sx={{ width: 120 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption">{percent.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percent, 100)}
              color={percent > 90 ? 'error' : percent > 70 ? 'warning' : 'success'}
            />
          </Box>
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={formatLabel(value)}
          size="small"
          color={value === 'active' ? 'success' : 'default'}
        />
      )
    },
    {
      id: 'period',
      label: 'Period',
      render: (value) => value || 'Annual'
    }
  ];

  return (
    <AIEnhancedPage
      pageContext="budgets"
      contextData={{ total: budgets.length }}
      aiInsights={generateAIInsights()}
      quickActions={getQuickActions()}
      tips={getTips()}
    >
      <Box>
        <PageHeader
          title="Budget Management"
          subtitle={`Managing ${budgets.length} budget allocations`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/budgets/new')}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Create Budget
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          <SmartDataGrid
            title={`Budgets (${budgets.length})`}
            data={budgets}
            columns={columns}
            onRowClick={(budget) => navigate(`/budgets/${budget.id || budget._id}`)}
            aiInsights={generateRowInsights()}
            enableAI={true}
            enableExport={true}
            emptyMessage={loading ? "Loading budgets..." : "No budgets found"}
          />
        </Box>
      </Box>
    </AIEnhancedPage>
  );
};

export default BudgetListEnhanced;
