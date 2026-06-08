// Revolutionary Dashboard Component
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Chip
} from '@mui/material';
import {
  Refresh,
  Settings,
  Fullscreen,
  DragIndicator,
  Add,
  TrendingUp,
  AttachMoney,
  People,
  ShoppingCart
} from '@mui/icons-material';
import { useDataFetcher } from '../hooks/useDataFetcher';
import { useNotifications } from './NotificationCenter';

// Widget definition
export interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  editable?: boolean;
}

// KPI card props
interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
  error?: string;
}

// KPI Card Component
const KpiCard = ({ title, value, change, icon, color = 'primary', loading, error }: KpiCardProps) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error" sx={{ height: '100%' }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="medium">
              {value}
            </Typography>
            {change !== undefined && (
              <Typography 
                variant="body2" 
                color={change >= 0 ? 'success.main' : 'error.main'}
                sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
              >
                <TrendingUp sx={{ fontSize: 14, mr: 0.5 }} />
                {change >= 0 ? '+' : ''}{change}%
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              bgcolor: `${color}.main`, 
              color: 'white', 
              p: 1, 
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Revolutionary Dashboard Props
interface RevolutionaryDashboardProps {
  title: string;
  widgets: DashboardWidget[];
  onRefresh?: () => void;
  onConfigure?: () => void;
  onAddWidget?: () => void;
  loading?: boolean;
  error?: string;
}

// Revolutionary Dashboard Component
const RevolutionaryDashboard = ({
  title,
  widgets,
  onRefresh,
  onConfigure,
  onAddWidget,
  loading = false,
  error
}: RevolutionaryDashboardProps) => {
  const [editing, setEditing] = useState(false);
  const { showError } = useNotifications();

  // Sample KPI data fetchers (in a real app, these would be actual API calls)
  const { data: salesData, loading: salesLoading, error: salesError } = useDataFetcher('/api/dashboard/sales');
  const { data: budgetData, loading: budgetLoading, error: budgetError } = useDataFetcher('/api/dashboard/budget');
  const { data: customerData, loading: customerLoading, error: customerError } = useDataFetcher('/api/dashboard/customers');
  const { data: trendData, loading: trendLoading, error: trendError } = useDataFetcher('/api/dashboard/trends');

  // Toggle editing mode
  const toggleEditing = () => {
    setEditing(!editing);
  };

  // Handle widget drag start
  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    if (!editing) return;
    e.dataTransfer.setData('widgetId', widgetId);
  };

  // Handle widget drop
  const handleDrop = (e: React.DragEvent) => {
    if (!editing) return;
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('widgetId');
    // In a real implementation, this would update widget positions
    console.log('Dropped widget:', widgetId);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    if (!editing) return;
    e.preventDefault();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Dashboard Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening today.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label="AI Insights Available" 
            color="primary" 
            variant="outlined" 
            size="small" 
            icon={<TrendingUp />}
          />
          
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={onRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          {onConfigure && (
            <Tooltip title="Configure Dashboard">
              <IconButton onClick={onConfigure}>
                <Settings />
              </IconButton>
            </Tooltip>
          )}
          
          {onAddWidget && (
            <Tooltip title="Add Widget">
              <IconButton onClick={onAddWidget}>
                <Add />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={editing ? "Done Editing" : "Edit Layout"}>
            <IconButton onClick={toggleEditing}>
              <DragIndicator />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Fullscreen">
            <IconButton>
              <Fullscreen />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Sales"
            value="$1.2M"
            change={12.5}
            icon={<AttachMoney />}
            color="primary"
            loading={salesLoading}
            error={salesError || undefined}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Budget Utilization"
            value="78%"
            change={-3.2}
            icon={<ShoppingCart />}
            color="secondary"
            loading={budgetLoading}
            error={budgetError || undefined}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Active Customers"
            value="1,248"
            change={8.7}
            icon={<People />}
            color="success"
            loading={customerLoading}
            error={customerError || undefined}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Growth Rate"
            value="+15.3%"
            change={2.1}
            icon={<TrendingUp />}
            color="warning"
            loading={trendLoading}
            error={trendError || undefined}
          />
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Typography>Loading dashboard...</Typography>
        </Box>
      ) : (
        <Grid 
          container 
          spacing={3}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {widgets.map((widget) => (
            <Grid
              item
              key={widget.id}
              xs={widget.xs || 12}
              sm={widget.sm || 6}
              md={widget.md || 4}
              lg={widget.lg || 3}
              xl={widget.xl || 3}
              draggable={editing && widget.editable !== false}
              onDragStart={(e) => handleDragStart(e, widget.id)}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  ...(editing && widget.editable !== false && {
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    cursor: 'move'
                  })
                }}
              >
                {editing && widget.editable !== false && (
                  <Box sx={{ p: 1, textAlign: 'right' }}>
                    <DragIndicator sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                )}
                <CardContent sx={{ height: '100%' }}>
                  {widget.component}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RevolutionaryDashboard;