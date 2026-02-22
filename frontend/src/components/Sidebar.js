import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  alpha,
} from '@mui/material';
import {
  Home as HomeIcon,
  Timeline as PlanIcon,
  AccountBalance as BudgetsIcon,
  AccountTree as AllocateIcon,
  CalendarMonth as CalendarIcon,
  Sensors as SignalsIcon,
  Science as ScenariosIcon,
  AutoFixHigh as OptimizerIcon,
  Campaign as PromotionsIcon,
  ShoppingCart as ExecuteIcon,
  AccountBalanceWallet as AccrueIcon,
  Receipt as SettleIcon,
  CheckCircle as ApprovalsIcon,
  BarChart as  InsightsIcon,
  Person as CustomerIcon,
  Assessment as ReportingIcon,
  Storage as DataIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 72;

const navItems = [
  { key: 'home', label: 'Home', icon: <HomeIcon />, path: '/dashboard' },
  { key: 'plan', label: 'Plan', icon: <PlanIcon />, path: '/baselines' },
  { key: 'budgets', label: 'Budget', icon: <BudgetsIcon />, path: '/budgets' },
  { key: 'allocate', label: 'Allocate', icon: <AllocateIcon />, path: '/budget-allocations' },
  { key: 'calendar', label: 'Calendar', icon: <CalendarIcon />, path: '/trade-calendar' },
  { key: 'signals', label: 'Signals', icon: <SignalsIcon />, path: '/demand-signals' },
  { key: 'scenarios', label: 'Scenarios', icon: <ScenariosIcon />, path: '/scenarios' },
  { key: 'optimizer', label: 'Optimize', icon: <OptimizerIcon />, path: '/promotion-optimizer' },
  { key: 'promotions', label: 'Promote', icon: <PromotionsIcon />, path: '/promotions' },
  { key: 'execute', label: 'Execute', icon: <ExecuteIcon />, path: '/trade-spends' },
  { key: 'accrue', label: 'Accrue', icon: <AccrueIcon />, path: '/accruals' },
  { key: 'settle', label: 'Settle', icon: <SettleIcon />, path: '/settlements' },
  { key: 'approvals', label: 'Approve', icon: <ApprovalsIcon />, path: '/approvals' },
  { key: 'pnl', label: 'P&L', icon: <InsightsIcon />, path: '/pnl' },
  { key: 'customer360', label: 'Customer 360', icon: <CustomerIcon />, path: '/customer-360' },
  { key: 'reporting', label: 'Reports', icon: <ReportingIcon />, path: '/advanced-reporting' },
  { key: 'data', label: 'Master Data', icon: <DataIcon />, path: '/customers' },
];

const bottomItems = [
  { key: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { key: 'help', label: 'Help', icon: <HelpIcon />, path: '/help' },
];

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userInitial = user?.name?.[0] || user?.email?.[0] || 'U';

  return (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: '#FFFFFF',
        borderRight: '1px solid',
        borderColor: 'divider',
        py: 2,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: '#7C3AED',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/dashboard')}
      >
        <Box
          component="span"
          sx={{
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.03em',
          }}
        >
          T
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip key={item.key} title={item.label} placement="right" arrow>
              <IconButton
                onClick={() => navigate(item.path)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  color: active ? '#7C3AED' : '#6B7280',
                  bgcolor: active ? (theme) => alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: active
                      ? (theme) => alpha(theme.palette.primary.main, 0.15)
                      : '#F3F4F6',
                    color: '#7C3AED',
                  },
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>

      <Divider sx={{ width: 32, my: 1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center', mb: 1 }}>
        {bottomItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip key={item.key} title={item.label} placement="right" arrow>
              <IconButton
                onClick={() => navigate(item.path)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  color: active ? '#7C3AED' : '#9CA3AF',
                  bgcolor: active ? (theme) => alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: '#F3F4F6',
                    color: '#7C3AED',
                  },
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
              </IconButton>
            </Tooltip>
          );
        })}

        <Tooltip title="Logout" placement="right" arrow>
          <IconButton
            onClick={onLogout}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              color: '#9CA3AF',
              '&:hover': { bgcolor: '#FEF2F2', color: '#DC2626' },
            }}
          >
            <LogoutIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Tooltip title={user?.name || user?.email || 'Profile'} placement="right" arrow>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#7C3AED',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { opacity: 0.85 },
          }}
          onClick={() => navigate('/settings')}
        >
          {userInitial.toUpperCase()}
        </Avatar>
      </Tooltip>
    </Box>
  );
};

export { SIDEBAR_WIDTH };
export default Sidebar;
