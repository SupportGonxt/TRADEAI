import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Tooltip,
  Avatar,
  Typography,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Home as HomeIcon,
  Campaign as PromotionsIcon,
  AccountBalance as BudgetsIcon,
  CheckCircle as ApprovalsIcon,
  BarChart as InsightsIcon,
  Receipt as ClaimsIcon,
  Storage as DataIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';

const SIDEBAR_WIDTH = 220;

const navGroups = [
  {
    key: 'home',
    label: 'Home',
    icon: <HomeIcon />,
    path: '/dashboard',
  },
  {
    key: 'promotions',
    label: 'Promotions',
    icon: <PromotionsIcon />,
    children: [
      { label: 'All Promotions', path: '/promotions' },
      { label: 'Trade Calendar', path: '/trade-calendar' },
      { label: 'Scenarios', path: '/scenarios' },
      { label: 'Optimizer', path: '/promotion-optimizer' },
    ],
  },
  {
    key: 'budgets',
    label: 'Budgets & Spend',
    icon: <BudgetsIcon />,
    children: [
      { label: 'Budgets', path: '/budgets' },
      { label: 'Allocations', path: '/budget-allocations' },
      { label: 'Trade Spends', path: '/trade-spends' },
      { label: 'Accruals', path: '/accruals' },
      { label: 'Settlements', path: '/settlements' },
    ],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    icon: <ApprovalsIcon />,
    path: '/approvals',
  },
  {
    key: 'claims',
    label: 'Claims & Deductions',
    icon: <ClaimsIcon />,
    children: [
      { label: 'Claims', path: '/claims' },
      { label: 'Deductions', path: '/deductions' },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: <InsightsIcon />,
    children: [
      { label: 'P&L', path: '/pnl' },
      { label: 'Customer 360', path: '/customer-360' },
      { label: 'Reports', path: '/advanced-reporting' },
      { label: 'RGM', path: '/revenue-growth' },
      { label: 'KPIs', path: '/executive-kpi' },
      { label: 'Demand Signals', path: '/demand-signals' },
    ],
  },
  {
    key: 'data',
    label: 'Master Data',
    icon: <DataIcon />,
    children: [
      { label: 'Customers', path: '/customers' },
      { label: 'Products', path: '/products' },
      { label: 'Baselines', path: '/baselines' },
    ],
  },
];

const bottomItems = [
  { key: 'settings', label: 'Settings', icon: <SettingsIcon />, path: '/system-config' },
  { key: 'help', label: 'Help', icon: <HelpIcon />, path: '/help' },
];

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState({});

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isGroupActive = (group) => {
    if (group.path) return isActive(group.path);
    return group.children?.some(c => isActive(c.path));
  };

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
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
        bgcolor: '#FFFFFF',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2.5,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/dashboard')}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            bgcolor: '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>T</Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827', letterSpacing: '-0.02em' }}>
          TRADEAI
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 0.5 }}>
        {navGroups.map((group) => {
          const active = isGroupActive(group);
          const isOpen = expanded[group.key] !== undefined ? expanded[group.key] : active;

          if (group.path) {
            return (
              <Box
                key={group.key}
                onClick={() => navigate(group.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  mb: 0.25,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: active ? '#7C3AED' : '#4B5563',
                  bgcolor: active ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  fontWeight: active ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: active ? (theme) => alpha(theme.palette.primary.main, 0.12) : '#F3F4F6',
                    color: '#7C3AED',
                  },
                }}
              >
                {React.cloneElement(group.icon, { sx: { fontSize: 20 } })}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 'inherit', color: 'inherit' }}>
                  {group.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Box key={group.key} sx={{ mb: 0.25 }}>
              <Box
                onClick={() => toggleExpand(group.key)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: active ? '#7C3AED' : '#4B5563',
                  bgcolor: active && !isOpen ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#F3F4F6',
                    color: '#7C3AED',
                  },
                }}
              >
                {React.cloneElement(group.icon, { sx: { fontSize: 20 } })}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500, color: 'inherit', flex: 1 }}>
                  {group.label}
                </Typography>
                {isOpen ? <CollapseIcon sx={{ fontSize: 18, opacity: 0.5 }} /> : <ExpandIcon sx={{ fontSize: 18, opacity: 0.5 }} />}
              </Box>
              <Collapse in={isOpen} timeout="auto">
                <Box sx={{ pl: 4.5, py: 0.25 }}>
                  {group.children.map((child) => {
                    const childActive = isActive(child.path);
                    return (
                      <Box
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        sx={{
                          py: 0.75,
                          px: 1,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          color: childActive ? '#7C3AED' : '#6B7280',
                          fontWeight: childActive ? 600 : 400,
                          bgcolor: childActive ? (theme) => alpha(theme.palette.primary.main, 0.06) : 'transparent',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: '#F3F4F6',
                            color: '#7C3AED',
                          },
                        }}
                      >
                        {child.label}
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ px: 1.5, pb: 1, borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
        {bottomItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Box
              key={item.key}
              onClick={() => navigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 0.75,
                borderRadius: '8px',
                cursor: 'pointer',
                color: active ? '#7C3AED' : '#9CA3AF',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 500,
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: '#F3F4F6', color: '#7C3AED' },
              }}
            >
              {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 'inherit', color: 'inherit' }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}

        <Box
          onClick={onLogout}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#9CA3AF',
            fontSize: '0.8125rem',
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: '#FEF2F2', color: '#DC2626' },
          }}
        >
          <LogoutIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'inherit' }}>
            Logout
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 2, pt: 1 }}>
        <Tooltip title={user?.name || user?.email || 'Profile'} placement="right" arrow>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.85 },
            }}
            onClick={() => navigate('/settings')}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#7C3AED',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {userInitial.toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827', lineHeight: 1.2 }} noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF', lineHeight: 1.2 }} noWrap>
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

export { SIDEBAR_WIDTH };
export default Sidebar;
