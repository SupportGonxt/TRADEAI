import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Badge,
  Button,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  CalendarMonth as CalendarIcon,
  FileDownload as ExportIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your trade spend performance' },
  '/promotions': { title: 'Promotions', subtitle: 'Manage and track promotional activities' },
  '/budgets': { title: 'Budgets', subtitle: 'Budget planning and allocation management' },
  '/budget-allocations': { title: 'Budget Allocations', subtitle: 'Allocate budgets across customers and channels' },
  '/trade-spends': { title: 'Trade Spends', subtitle: 'Manage marketing, cash co-op, and promotional spend' },
  '/accruals': { title: 'Accruals', subtitle: 'Track and manage trade spend accruals' },
  '/settlements': { title: 'Settlements', subtitle: 'Settle accruals and finalize payments' },
  '/approvals': { title: 'Approvals', subtitle: 'Review and manage approval workflows' },
  '/claims': { title: 'Claims', subtitle: 'Manage customer claims' },
  '/deductions': { title: 'Deductions', subtitle: 'Track and reconcile deductions' },
  '/pnl': { title: 'P&L Analysis', subtitle: 'Profit & loss by customer and promotion' },
  '/customer-360': { title: 'Customer 360', subtitle: 'Complete customer intelligence view' },
  '/advanced-reporting': { title: 'Reports', subtitle: 'Advanced reporting and analytics' },
  '/revenue-growth': { title: 'Revenue Growth', subtitle: 'Revenue growth management strategies' },
  '/executive-kpi': { title: 'Executive KPIs', subtitle: 'Key performance indicators dashboard' },
  '/demand-signals': { title: 'Demand Signals', subtitle: 'Market demand intelligence' },
  '/trade-calendar': { title: 'Trade Calendar', subtitle: 'Promotional calendar and scheduling' },
  '/scenarios': { title: 'Scenarios', subtitle: 'What-if scenario planning and analysis' },
  '/promotion-optimizer': { title: 'Promotion Optimizer', subtitle: 'AI-powered promotion optimization' },
  '/baselines': { title: 'Baselines', subtitle: 'Baseline sales management' },
  '/customers': { title: 'Customers', subtitle: 'Customer master data management' },
  '/products': { title: 'Products', subtitle: 'Product master data management' },
  '/system-config': { title: 'System Config', subtitle: 'System configuration and settings' },
  '/help': { title: 'Help Center', subtitle: 'Documentation and training resources' },
  '/notification-center': { title: 'Notifications', subtitle: 'Alerts and notification management' },
  '/document-management': { title: 'Documents', subtitle: 'Document management' },
  '/integration-hub': { title: 'Integrations', subtitle: 'Integration hub and connectors' },
  '/role-management': { title: 'Roles', subtitle: 'Role and permission management' },
  '/workflow-engine': { title: 'Workflows', subtitle: 'Workflow automation engine' },
  '/vendors': { title: 'Vendors', subtitle: 'Vendor management and tracking' },
  '/trading-terms': { title: 'Trading Terms', subtitle: 'Configure trading terms and conditions' },
  '/rebates': { title: 'Rebates', subtitle: 'Manage rebate programs' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Campaign management and tracking' },
  '/users': { title: 'Users', subtitle: 'User management and roles' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account and preferences' },
  '/forecasting': { title: 'Forecasting', subtitle: 'AI-powered predictive analytics' },
  '/simulation-studio': { title: 'Simulation Studio', subtitle: 'What-if scenario analysis' },
  '/predictive-analytics': { title: 'Predictive Analytics', subtitle: 'AI-driven predictions' },
  '/kamwallet': { title: 'KAM Wallet', subtitle: 'Key account manager budget wallet' },
};

const getPageInfo = (pathname) => {
  for (const [path, info] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return info;
    }
  }
  return { title: 'TRADEAI', subtitle: 'Trade Spend Management Platform' };
};

const TopHeader = ({ onMenuClick }) => {
  const location = useLocation();
  const [dateAnchor, setDateAnchor] = useState(null);
  const [selectedRange, setSelectedRange] = useState('This Month');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const resp = await apiClient.get('/approvals/pending');
        const items = resp.data?.data || resp.data || [];
        setPendingCount(Array.isArray(items) ? items.length : 0);
      } catch (e) { /* ignore */ }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const pageInfo = getPageInfo(location.pathname);

  const dateRanges = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Last 30 Days', 'Last 90 Days'];

  const handleDateSelect = (range) => {
    setSelectedRange(range);
    setDateAnchor(null);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        py: 2,
        minHeight: 72,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            width: 40,
            height: 40,
            mt: 0.25,
            '&:hover': { bgcolor: '#E5E7EB' },
          }}
        >
          <MenuIcon sx={{ fontSize: 20, color: '#6B7280' }} />
        </IconButton>

        <Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#111827',
            fontSize: { xs: '1.15rem', sm: '1.5rem' },
            lineHeight: 1.3,
          }}
        >
          {pageInfo.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            display: { xs: 'none', sm: 'block' },
            color: '#6B7280',
            fontSize: '0.85rem',
            mt: 0.25,
          }}
        >
          {pageInfo.subtitle}
        </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            px: 2,
            py: 0.75,
            minWidth: 200,
            maxWidth: 280,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              bgcolor: '#fff',
              boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.2)',
            },
          }}
        >
          <SearchIcon sx={{ color: '#9CA3AF', fontSize: 20, mr: 1 }} />
          <InputBase
            placeholder="Search everything..."
            sx={{
              fontSize: '0.875rem',
              color: '#374151',
              flex: 1,
              '& input::placeholder': {
                color: '#9CA3AF',
                opacity: 1,
              },
            }}
          />
        </Box>

        <IconButton
          sx={{
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            width: 40,
            height: 40,
            '&:hover': { bgcolor: '#E5E7EB' },
          }}
        >
          <Badge badgeContent={pendingCount} color="error" invisible={pendingCount === 0} sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}>
            <NotificationsIcon sx={{ fontSize: 20, color: '#6B7280' }} />
          </Badge>
        </IconButton>

        <Button
          onClick={(e) => setDateAnchor(e.currentTarget)}
          startIcon={<CalendarIcon sx={{ fontSize: 18 }} />}
          endIcon={<ArrowDownIcon />}
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#F3F4F6',
            borderRadius: '12px',
            color: '#374151',
            fontWeight: 500,
            fontSize: '0.85rem',
            px: 2,
            py: 0.75,
            textTransform: 'none',
            '&:hover': { bgcolor: '#E5E7EB' },
          }}
        >
          {formattedDate}
        </Button>
        <Menu
          anchorEl={dateAnchor}
          open={Boolean(dateAnchor)}
          onClose={() => setDateAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              mt: 1,
              minWidth: 180,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            },
          }}
        >
          {dateRanges.map((range) => (
            <MenuItem
              key={range}
              selected={range === selectedRange}
              onClick={() => handleDateSelect(range)}
              sx={{
                fontSize: '0.85rem',
                py: 1,
                borderRadius: '8px',
                mx: 0.5,
                '&.Mui-selected': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: '#7C3AED',
                },
              }}
            >
              {range}
            </MenuItem>
          ))}
        </Menu>

        <Button
          variant="contained"
          startIcon={<ExportIcon sx={{ fontSize: 18 }} />}
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            bgcolor: '#7C3AED',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.85rem',
            px: 2.5,
            py: 0.85,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#6D28D9',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
            },
          }}
        >
          Export
        </Button>
      </Box>
    </Box>
  );
};

export default TopHeader;
