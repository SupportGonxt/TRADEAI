import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse,
  IconButton,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Lightbulb as LightbulbIcon,
  RocketLaunch as RocketIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  Storage as DataIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Close as CloseIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { formatLabel } from '../utils/formatters';

const MobileDrawer= ({ open, onClose, user, onLogout }) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = React.useState({});

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isManager = user?.role === 'manager' || isAdmin;
  const isKAM = user?.role === 'kam' || isManager;

  const toggleMenu = (key) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <DashboardIcon />,
      path: '/dashboard'
    },
    {
      key: 'promotions',
      label: 'Promotions',
      icon: <LightbulbIcon />,
      children: [
        { label: 'All Promotions', path: '/promotions' },
        { label: 'Campaigns', path: '/campaigns' },
        { label: 'Trade Calendar', path: '/trade-calendar' },
        { label: 'Scenarios', path: '/scenarios' },
        { label: 'Optimizer', path: '/promotion-optimizer' },
      ]
    },
    {
      key: 'budgets',
      label: 'Budgets & Spend',
      icon: <RocketIcon />,
      children: [
        { label: 'Budgets', path: '/budgets' },
        { label: 'Allocations', path: '/budget-allocations' },
        { label: 'Trade Spends', path: '/trade-spends' },
        { label: 'KAM Wallet', path: '/kamwallet' },
        { label: 'Accruals', path: '/accruals' },
        { label: 'Settlements', path: '/settlements' },
      ]
    },
    {
      key: 'approvals',
      label: 'Approvals',
      icon: <AssignmentIcon />,
      path: '/approvals'
    },
    {
      key: 'claims',
      label: 'Claims & Deductions',
      icon: <ReceiptIcon />,
      children: [
        { label: 'Claims', path: '/claims' },
        { label: 'Deductions', path: '/deductions' },
        { label: 'Reconciliation', path: '/deductions/reconciliation' },
      ]
    },
    {
      key: 'insights',
      label: 'Insights',
      icon: <AnalyticsIcon />,
      children: [
        { label: 'P&L', path: '/pnl' },
        { label: 'Customer 360', path: '/customer-360' },
        { label: 'Reports', path: '/advanced-reporting' },
        { label: 'RGM', path: '/revenue-growth' },
        { label: 'Executive KPIs', path: '/executive-kpi' },
        { label: 'Demand Signals', path: '/demand-signals' },
        { label: 'Forecasting', path: '/forecasting' },
      ]
    },
    {
      key: 'transactions',
      label: 'Transactions',
      icon: <DataIcon />,
      children: [
        { label: 'All Transactions', path: '/transactions' },
        { label: 'Import Center', path: '/import-center' },
      ]
    },
    {
      key: 'data',
      label: 'Master Data',
      icon: <DataIcon />,
      children: [
        { label: 'Customers', path: '/customers' },
        { label: 'Products', path: '/products' },
        { label: 'Vendors', path: '/vendors' },
        { label: 'Trading Terms', path: '/trading-terms' },
        { label: 'Baselines', path: '/baselines' },
      ]
    },
    isAdmin && {
      key: 'admin',
      label: 'Administration',
      icon: <SettingsIcon />,
      children: [
        { label: 'Users', path: '/users' },
        { label: 'Roles', path: '/role-management' },
        { label: 'Workflows', path: '/workflow-engine' },
        { label: 'Integrations', path: '/integration-hub' },
        { label: 'Documents', path: '/document-management' },
        { label: 'Notifications', path: '/notification-center' },
        { label: 'System Config', path: '/system-config' },
      ]
    },
    {
      key: 'help',
      label: 'Help',
      icon: <SettingsIcon />,
      path: '/help'
    },
  ].filter(Boolean);

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '85%',
          maxWidth: 320,
          bgcolor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img 
            src="/logo.svg" 
            alt="TRADEAI" 
            style={{ height: 32, width: 'auto' }}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* User Info */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5,
        bgcolor: '#F9FAFB'
      }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Chip 
          label={formatLabel(user?.role) || 'User'} 
          size="small" 
          sx={{ height: 20, fontSize: '0.65rem' }}
        />
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => (
            <React.Fragment key={item.key}>
              {item.path ? (
                // Direct link item
                <ListItem disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    onClick={onClose}
                    selected={isActive(item.path)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&.Mui-selected': {
                        bgcolor: alpha('#7C3AED', 0.08),
                        borderRight: '3px solid',
                        borderColor: '#7C3AED',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive(item.path) ? 600 : 500,
                        fontSize: '0.95rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ) : (
                // Expandable menu
                <>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => toggleMenu(item.key)}
                      sx={{ py: 1.5, px: 2 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          fontSize: '0.95rem'
                        }}
                      />
                      {expandedMenus[item.key] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={expandedMenus[item.key]} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {item.children?.map((child, idx) => (
                        <ListItem key={idx} disablePadding>
                          <ListItemButton
                            component={RouterLink}
                            to={child.path}
                            onClick={onClose}
                            selected={isActive(child.path)}
                            sx={{
                              py: 1,
                              pl: 7,
                              pr: 2,
                              '&.Mui-selected': {
                                bgcolor: alpha('#7C3AED', 0.08),
                              }
                            }}
                          >
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {child.label}
                                  {child.badge && (
                                    <Chip
                                      label={child.badge}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        backgroundColor: child.badge === 'AI' ? '#7C3AED' : 
                                                         child.badge === 'NEW' ? '#10b981' :
                                                         child.badge === 'LIVE' ? '#ef4444' : '#f59e0b',
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                              }
                              primaryTypographyProps={{
                                fontWeight: isActive(child.path) ? 600 : 400,
                                fontSize: '0.875rem',
                                color: isActive(child.path) ? 'primary.main' : 'text.secondary'
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => {
            onLogout();
            onClose();
          }}
          sx={{
            borderRadius: 2,
            bgcolor: alpha('#DC2626', 0.08),
            color: '#DC2626',
            '&:hover': {
              bgcolor: alpha('#DC2626', 0.12),
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#DC2626' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default MobileDrawer;
