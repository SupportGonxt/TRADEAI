import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { usePageVariants } from '../../hooks/usePageVariants';

import BudgetOverview from './tabs/BudgetOverview';
import BudgetAllocations from './tabs/BudgetAllocations';
import BudgetSpending from './tabs/BudgetSpending';
import BudgetTransfers from './tabs/BudgetTransfers';
import BudgetApprovals from './tabs/BudgetApprovals';
import BudgetScenarios from './tabs/BudgetScenarios';
import BudgetForecast from './tabs/BudgetForecast';
import BudgetHistory from './tabs/BudgetHistory';

const BudgetDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  
  const pageVariant = usePageVariants('budgetDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'allocations', label: 'Allocations', path: 'allocations' },
    { id: 'spending', label: 'Spending', path: 'spending' },
    { id: 'transfers', label: 'Transfers', path: 'transfers' },
    { id: 'approvals', label: 'Approvals', path: 'approvals' },
    { id: 'scenarios', label: 'Scenarios', path: 'scenarios' },
    { id: 'forecast', label: 'Forecast', path: 'forecast' },
    { id: 'history', label: 'History', path: 'history' }
  ];

  useEffect(() => {
    loadBudget();
    analytics.trackPageView('budget_detail', { budgetId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets/${id}`);
      setBudget(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error('Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/budgets/${id}/${newValue}`);
    analytics.trackEvent('budget_tab_changed', { budgetId: id, tab: newValue });
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

  if (!budget) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Budget not found</Typography>
      </Container>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/budgets')}
            sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            Back to Budgets
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">{budget.name}</Typography>
                <Chip label={formatLabel(budget.status)} color={budget.status === 'active' ? 'success' : budget.status === 'approved' ? 'info' : 'default'} sx={{ fontWeight: 600 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">{budget.code} - {budget.year}</Typography>
            </Box>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/budgets/${id}/edit`)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Edit</Button>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 56 } }}>
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        <Box>
          {activeTab === 'overview' && <BudgetOverview budget={budget} onUpdate={loadBudget} />}
          {activeTab === 'funding' && <BudgetSpending budgetId={id} budget={budget} />}
          {activeTab === 'allocations' && <BudgetAllocations budgetId={id} budget={budget} onUpdate={loadBudget} />}
          {activeTab === 'promotions' && <BudgetAllocations budgetId={id} budget={budget} onUpdate={loadBudget} />}
          {activeTab === 'claims' && <BudgetApprovals budgetId={id} budget={budget} />}
          {activeTab === 'reconcile' && <BudgetSpending budgetId={id} budget={budget} />}
          {activeTab === 'audit' && <BudgetHistory budgetId={id} budget={budget} />}
          {activeTab === 'spending' && <BudgetSpending budgetId={id} budget={budget} />}
          {activeTab === 'transfers' && <BudgetTransfers budgetId={id} budget={budget} onUpdate={loadBudget} />}
          {activeTab === 'approvals' && <BudgetApprovals budgetId={id} budget={budget} />}
          {activeTab === 'scenarios' && <BudgetScenarios budgetId={id} budget={budget} />}
          {activeTab === 'forecast' && <BudgetForecast budgetId={id} budget={budget} />}
          {activeTab === 'history' && <BudgetHistory budgetId={id} budget={budget} />}
          {activeTab === 'vendor-funding' && <BudgetSpending budgetId={id} budget={budget} />}
          {activeTab === 'store-budgets' && <BudgetAllocations budgetId={id} budget={budget} onUpdate={loadBudget} />}
          {activeTab === 'offers' && <BudgetAllocations budgetId={id} budget={budget} onUpdate={loadBudget} />}
          {activeTab === 'execution' && <BudgetSpending budgetId={id} budget={budget} />}
          {activeTab === 'settlements' && <BudgetHistory budgetId={id} budget={budget} />}
        </Box>
      </Container>
  );
};

export default BudgetDetailWithTabs;
