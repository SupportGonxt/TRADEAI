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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Api,
  Key,
  Analytics,
  Security,
  Speed,
  Add,
  Delete,
  Refresh,
  Visibility,
  VisibilityOff,
  ContentCopy,
  CheckCircle,
  TrendingUp,
  Storage,
  NetworkCheck
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const APIManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [usage, setUsage] = useState([]);
  const [health, setHealth] = useState(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});

  // Form states
  const [newKeyConfig, setNewKeyConfig] = useState({
    tier: 'free',
    name: '',
    description: ''
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api-management/dashboard');
      const data = response.data;

      setApiKeys(data.apiKeys || []);
      setAnalytics(data.analytics || null);
      setUsage(data.usage || []);
      setHealth(data.health || null);
    } catch (error) {
      setError('Failed to load API management data');
      console.error('Error loading API management data:', error);
      setApiKeys([]);
      setAnalytics(null);
      setUsage([]);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generateAPIKey = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API key generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newKey = {
        id: `key_${Date.now()}`,
        key: `tradeai_${Math.random().toString(36).substr(2, 56)}`,
        tier: newKeyConfig.tier,
        name: newKeyConfig.name || `${newKeyConfig.tier} API Key`,
        rateLimit: getTierConfig(newKeyConfig.tier).rateLimit,
        dailyQuota: getTierConfig(newKeyConfig.tier).dailyQuota,
        quotaUsed: 0,
        active: true,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0
      };

      setApiKeys(prev => [...prev, newKey]);
      setKeyDialogOpen(false);
      setNewKeyConfig({ tier: 'free', name: '', description: '' });
      
      alert('API key generated successfully!');
    } catch (error) {
      setError('Failed to generate API key');
      console.error('Error generating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeAPIKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock API key revocation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, active: false, revokedAt: new Date().toISOString() } : key
      ));

      alert('API key revoked successfully!');
    } catch (error) {
      setError('Failed to revoke API key');
      console.error('Error revoking API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('API key copied to clipboard!');
  };

  const toggleSecretVisibility = (keyId) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const getTierConfig = (tier) => {
    const configs = {
      free: { rateLimit: 100, dailyQuota: 1000, color: 'default' },
      pro: { rateLimit: 500, dailyQuota: 10000, color: 'primary' },
      enterprise: { rateLimit: 2000, dailyQuota: 100000, color: 'success' }
    };
    return configs[tier] || configs.free;
  };

  const getTierColor = (tier) => {
    return getTierConfig(tier).color;
  };

  const formatKey = (key, show = false) => {
    if (show) return key;
    return `${key.substring(0, 12)}...${key.substring(key.length - 8)}`;
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading && !analytics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          API Management Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setKeyDialogOpen(true)}
          >
            Generate API Key
          </Button>
          <Button
            startIcon={<Refresh />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {analytics && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Requests
                    </Typography>
                    <Typography variant="h4">
                      {analytics.totalRequests.toLocaleString()}
                    </Typography>
                  </Box>
                  <Api sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
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
                      Success Rate
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {analytics.successRate}%
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
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
                      Avg Response Time
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {analytics.averageResponseTime}ms
                    </Typography>
                  </Box>
                  <Speed sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
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
                      Active API Keys
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {apiKeys.filter(key => key.active).length}
                    </Typography>
                  </Box>
                  <Key sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="API Keys" icon={<Key />} />
          <Tab label="Analytics" icon={<Analytics />} />
          <Tab label="Usage Trends" icon={<TrendingUp />} />
          <Tab label="System Health" icon={<NetworkCheck />} />
        </Tabs>

        {/* API Keys Tab */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>API Key</TableCell>
                  <TableCell>Tier</TableCell>
                  <TableCell>Rate Limit</TableCell>
                  <TableCell>Daily Quota</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {key.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {format(new Date(key.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontFamily="monospace">
                          {formatKey(key.key, showSecrets[key.id])}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => toggleSecretVisibility(key.id)}
                        >
                          {showSecrets[key.id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={key.tier}
                        color={getTierColor(key.tier)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{key.rateLimit}/hour</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {key.quotaUsed.toLocaleString()} / {key.dailyQuota.toLocaleString()}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(key.quotaUsed / key.dailyQuota) * 100}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {key.usageCount.toLocaleString()} total
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last used: {key.lastUsed ? format(new Date(key.lastUsed), 'MMM dd, HH:mm') : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={key.active ? 'Active' : 'Revoked'}
                        color={key.active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {key.active && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => revokeAPIKey(key.id)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Request Volume & Response Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.hourlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" tickFormatter={(hour) => format(new Date(hour + ':00:00'), 'HH:mm')} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="requests" fill="#8884d8" name="Requests" />
                      <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#ff7300" name="Response Time (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Endpoints
                  </Typography>
                  <List>
                    {(analytics?.topEndpoints || []).map((endpoint, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={endpoint.endpoint}
                          secondary={`${endpoint.count.toLocaleString()} requests`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Status Code Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(analytics.statusCodeDistribution).map(([code, count]) => ({
                          name: `HTTP ${code}`,
                          value: count,
                          code
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                        {Object.entries(analytics.statusCodeDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Usage Trends Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    7-Day Usage Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={usage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="requests" stackId="1" stroke="#8884d8" fill="#8884d8" name="Requests" />
                      <Area yAxisId="left" type="monotone" dataKey="errors" stackId="2" stroke="#ff7300" fill="#ff7300" name="Errors" />
                      <Line yAxisId="right" type="monotone" dataKey="averageResponseTime" stroke="#00C49F" name="Avg Response Time (ms)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* System Health Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Status
                  </Typography>
                  {health && (
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle color={health.status === 'healthy' ? 'success' : 'error'} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Overall Health"
                          secondary={health.status}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Storage color={health.redis === 'connected' ? 'success' : 'error'} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Redis Connection"
                          secondary={health.redis}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Security />
                        </ListItemIcon>
                        <ListItemText
                          primary="Rate Limiters"
                          secondary={`${health.rateLimiters} active`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Key />
                        </ListItemIcon>
                        <ListItemText
                          primary="API Keys"
                          secondary={`${health.apiKeys} configured`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Analytics />
                        </ListItemIcon>
                        <ListItemText
                          primary="Analytics Data Points"
                          secondary={`${health.analytics} stored`}
                        />
                      </ListItem>
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Request Success Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analytics?.successRate || 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {analytics?.successRate || 0}%
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Average Response Time
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((analytics?.averageResponseTime || 0) / 500 * 100, 100)}
                      color={analytics?.averageResponseTime < 200 ? 'success' : analytics?.averageResponseTime < 400 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {analytics?.averageResponseTime || 0}ms
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Error Rate
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analytics ? (analytics.totalErrors / analytics.totalRequests) * 100 : 0}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {analytics ? ((analytics.totalErrors / analytics.totalRequests) * 100).toFixed(2) : 0}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Generate API Key Dialog */}
      <Dialog open={keyDialogOpen} onClose={() => setKeyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New API Key</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Key Name"
                  value={newKeyConfig.name}
                  onChange={(e) => setNewKeyConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production API Key"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tier</InputLabel>
                  <Select
                    value={newKeyConfig.tier}
                    onChange={(e) => setNewKeyConfig(prev => ({ ...prev, tier: e.target.value }))}
                  >
                    <MenuItem value="free">Free (100 req/hour, 1K daily)</MenuItem>
                    <MenuItem value="pro">Pro (500 req/hour, 10K daily)</MenuItem>
                    <MenuItem value="enterprise">Enterprise (2K req/hour, 100K daily)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (optional)"
                  multiline
                  rows={3}
                  value={newKeyConfig.description}
                  onChange={(e) => setNewKeyConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this API key..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeyDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={generateAPIKey}
            disabled={loading}
          >
            Generate Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APIManagementDashboard;
