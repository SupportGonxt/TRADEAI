import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Badge,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Insights,
  TrendingUp,
  Warning,
  CheckCircle,
  Info,
  Lightbulb,
  Refresh,
  FilterList,
  NotificationsActive,
  Download
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [insightFilters, setInsightFilters] = useState({
    types: [],
    priority: '',
    timeRange: 30,
    includeRecommendations: true
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Real-time monitoring state
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    generateInsights();
    
    // Set up auto-refresh
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        generateInsights();
        checkAlerts();
      }, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, insightFilters]);

  const generateInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeRange: insightFilters.timeRange.toString(),
        includeRecommendations: insightFilters.includeRecommendations.toString()
      });

      if (insightFilters.types.length > 0) {
        params.append('types', insightFilters.types.join(','));
      }

      if (insightFilters.priority) {
        params.append('priority', insightFilters.priority);
      }

      // Call actual API for insights
      const response = await api.get('/ai/insights');
      setInsights(response.data.data || []);
    } catch (error) {
      setError('Failed to generate insights');
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    if (!alertsEnabled) return;

    try {
      // Call actual API for alerts
      const response = await api.get('/ai/alerts');
      
      if (response.data.data.alerts.length > 0) {
        setAlerts(prev => [...response.data.data.alerts, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return <TrendingUp color="error" />;
      case 'medium': return <TrendingUp color="warning" />;
      case 'low': return <TrendingUp color="success" />;
      default: return <Info />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const handleInsightClick = (insight) => {
    setSelectedInsight(insight);
    setDetailDialogOpen(true);
  };



  const InsightCard = ({ insight }) => (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        '&:hover': { boxShadow: 4 }
      }}
      onClick={() => handleInsightClick(insight)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {getImpactIcon(insight.impact)}
              <Typography variant="h6">
                {insight.title}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              {insight.summary}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Chip
              label={insight.priority}
              color={getPriorityColor(insight.priority)}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              {format(new Date(insight.generatedAt), 'MMM dd, HH:mm')}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={`Confidence: ${(insight.confidence * 100).toFixed(0)}%`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Impact: ${insight.impact}`}
            size="small"
            variant="outlined"
            color={insight.impact === 'high' ? 'error' : insight.impact === 'medium' ? 'warning' : 'success'}
          />
          <Chip
            label={`Urgency: ${insight.urgency}`}
            size="small"
            variant="outlined"
            color={getUrgencyColor(insight.urgency)}
          />
        </Box>

        {insight.recommendations && insight.recommendations.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Key Recommendations:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {insight.recommendations.slice(0, 2).map((rec, index) => (
                <Chip
                  key={index}
                  label={rec}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
              {insight.recommendations.length > 2 && (
                <Chip
                  label={`+${insight.recommendations.length - 2} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const AlertItem = ({ alert }) => (
    <ListItem>
      <ListItemIcon>
        <Badge color="error" variant="dot">
          <Warning color={alert.severity === 'high' ? 'error' : 'warning'} />
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={alert.name}
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {alert.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(alert.triggeredAt), 'MMM dd, HH:mm')}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          AI Insights & Alerts
        </Typography>
        <Box display="flex" gap={1}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <FormControlLabel
            control={
              <Switch
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
              />
            }
            label="Alerts"
          />
          <Button
            startIcon={<FilterList />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={generateInsights}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Insights
                  </Typography>
                  <Typography variant="h4">
                    {insights.length}
                  </Typography>
                </Box>
                <Insights sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    High Priority
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {insights.filter(i => i.priority === 'high').length}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Alerts
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {alerts.length}
                  </Typography>
                </Box>
                <NotificationsActive sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Confidence
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {insights.length > 0 ? 
                      (insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100).toFixed(0) + '%' 
                      : '0%'
                    }
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Insights List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                AI-Generated Insights
              </Typography>
              {loading && <CircularProgress size={24} />}
            </Box>
            
            {insights.length > 0 ? (
              insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  {loading ? 'Generating insights...' : 'No insights available'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Alerts & Quick Stats */}
        <Grid item xs={12} md={4}>
          {/* Active Alerts */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            {alerts.length > 0 ? (
              <List dense>
                {alerts.slice(0, 5).map((alert, index) => (
                  <AlertItem key={index} alert={alert} />
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={2}>
                No active alerts
              </Typography>
            )}
          </Paper>

          {/* Insight Categories */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Insight Categories
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Revenue', value: insights.filter(i => i.type.includes('revenue')).length },
                    { name: 'Customer', value: insights.filter(i => i.type.includes('customer')).length },
                    { name: 'Promotion', value: insights.filter(i => i.type.includes('promotion')).length },
                    { name: 'Market', value: insights.filter(i => i.type.includes('market')).length },
                    { name: 'Other', value: insights.filter(i => !['revenue', 'customer', 'promotion', 'market'].some(t => i.type.includes(t))).length }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {insights.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          {/* Monitoring Status */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monitoring Status
            </Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Auto Refresh</Typography>
                <Chip
                  label={autoRefresh ? 'ON' : 'OFF'}
                  color={autoRefresh ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Alert System</Typography>
                <Chip
                  label={alertsEnabled ? 'ACTIVE' : 'DISABLED'}
                  color={alertsEnabled ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Last Update</Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(), 'HH:mm:ss')}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Insight Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedInsight?.title}
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label={selectedInsight?.priority}
                color={getPriorityColor(selectedInsight?.priority)}
                size="small"
              />
              <Chip
                label={`${(selectedInsight?.confidence * 100).toFixed(0)}% confidence`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInsight && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedInsight.summary}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              {selectedInsight.data && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Detailed Analysis
                  </Typography>
                  {selectedInsight.type === 'revenue_trend' && selectedInsight.data.forecast && (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Revenue Forecast (Next 3 Days)
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={selectedInsight.data.forecast.nextWeek}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <RechartsTooltip 
                            labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                            formatter={(value) => [formatCurrency(value), 'Revenue']}
                          />
                          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                  
                  {selectedInsight.type === 'churn_risk' && selectedInsight.data.churnRisk && (
                    <Box>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            High Risk Customers
                          </Typography>
                          <Typography variant="h6" color="error.main">
                            {selectedInsight.data.churnRisk.highRiskCustomers}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Potential Revenue Loss
                          </Typography>
                          <Typography variant="h6" color="error.main">
                            {formatCurrency(selectedInsight.data.churnRisk.potentialRevenueLoss)}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Top Risk Factors
                          </Typography>
                          {(selectedInsight?.data?.churnRisk?.topRiskFactors || []).map((factor, index) => (
                            <Chip key={index} label={factor} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
              
              {selectedInsight.recommendations && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <List>
                    {(selectedInsight?.recommendations || []).map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Lightbulb color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Insight Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={insightFilters.priority}
                  onChange={(e) => setInsightFilters(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Time Range (days)"
                type="number"
                value={insightFilters.timeRange}
                onChange={(e) => setInsightFilters(prev => ({
                  ...prev,
                  timeRange: parseInt(e.target.value)
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={insightFilters.includeRecommendations}
                    onChange={(e) => setInsightFilters(prev => ({
                      ...prev,
                      includeRecommendations: e.target.checked
                    }))}
                  />
                }
                label="Include Recommendations"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setFilterDialogOpen(false);
              generateInsights();
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIInsights;
