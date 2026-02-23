import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { usePageVariants } from '../../hooks/usePageVariants';
import { useCompanyType } from '../../contexts/CompanyTypeContext';

import CustomerOverview from './tabs/CustomerOverview';
import CustomerPromotions from './tabs/CustomerPromotions';
import CustomerTradeSpends from './tabs/CustomerTradeSpends';
import CustomerTradingTerms from './tabs/CustomerTradingTerms';
import CustomerBudgets from './tabs/CustomerBudgets';
import CustomerClaims from './tabs/CustomerClaims';
import CustomerDeductions from './tabs/CustomerDeductions';
import CustomerSalesHistory from './tabs/CustomerSalesHistory';

const CustomerDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const pageVariant = usePageVariants('customerDetail');
  const { labels } = useCompanyType();
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'promotions', label: 'Promotions', path: 'promotions' },
    { id: 'trade-spends', label: 'Trade Spends', path: 'trade-spends' },
    { id: 'trading-terms', label: 'Trading Terms', path: 'trading-terms' },
    { id: 'budgets', label: 'Budgets', path: 'budgets' },
    { id: 'claims', label: 'Claims', path: 'claims' },
    { id: 'deductions', label: 'Deductions', path: 'deductions' },
    { id: 'sales-history', label: 'Sales History', path: 'sales-history' }
  ];

  useEffect(() => {
    loadCustomer();
    analytics.trackPageView('customer_detail', { customerId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/customers/${id}`);
      setCustomer(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/customers/${id}/${newValue}`);
    analytics.trackEvent('customer_tab_changed', { customerId: id, tab: newValue });
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

  if (!customer) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Customer not found</Typography>
      </Container>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/customers')}
            sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            Back to {labels.customers}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">{customer.name}</Typography>
                <Chip label={formatLabel(customer.status)} color={customer.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">{customer.code}</Typography>
            </Box>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/customers/${id}/edit`)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Edit</Button>
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
          {activeTab === 'overview' && <CustomerOverview customer={customer} onUpdate={loadCustomer} />}
          {activeTab === 'hierarchy' && <CustomerOverview customer={customer} onUpdate={loadCustomer} />}
          {activeTab === 'promotions' && <CustomerPromotions customerId={id} customer={customer} />}
          {activeTab === 'trade-spends' && <CustomerTradeSpends customerId={id} customer={customer} />}
          {activeTab === 'trading-terms' && <CustomerTradingTerms customerId={id} customer={customer} />}
          {activeTab === 'budgets' && <CustomerBudgets customerId={id} customer={customer} />}
          {activeTab === 'claims' && <CustomerClaims customerId={id} customer={customer} />}
          {activeTab === 'deductions' && <CustomerDeductions customerId={id} customer={customer} />}
          {activeTab === 'sales-history' && <CustomerSalesHistory customerId={id} customer={customer} />}
          {activeTab === 'allocations' && <CustomerBudgets customerId={id} customer={customer} />}
          {activeTab === 'offers' && <CustomerPromotions customerId={id} customer={customer} />}
          {activeTab === 'execution' && <CustomerTradeSpends customerId={id} customer={customer} />}
          {activeTab === 'settlements' && <CustomerClaims customerId={id} customer={customer} />}
        </Box>
      </Container>
  );
};

export default CustomerDetailWithTabs;
