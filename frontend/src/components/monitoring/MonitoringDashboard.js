import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Timeline,
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Settings,
  Download,
  Visibility,
  ExpandMore,
  Search,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area} from 'recharts';
import api from '../../services/api';

const MonitoringDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState({});
  const [logs, setLogs] = useState([]);
  const [traces, setTraces] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [, setDashboards] = useState([]);
  const [alertDialog, setAlertDialog] = useState({ open: false, alert: null });
  const [logDialog, setLogDialog] = useState({ open: false, log: null });
  const [traceDialog, setTraceDialog] = useState({ open: false, trace: null });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30);
  const [filters, setFilters] = useState({
    timeRange: '1h',
    logLevel: 'all',
    service: 'all'
  });

  useEffect(() => {
    loadMonitoringData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, refreshInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      const [metricsRes, logsRes, tracesRes, alertsRes, dashboardsRes] = await Promise.all([
        api.get('/monitoring/metrics', { params: filters }),
        api.get('/monitoring/logs', { params: filters }),
        api.get('/monitoring/traces', { params: filters }),
        api.get('/monitoring/alerts'),
        api.get('/monitoring/dashboards')
      ]);

      setMetrics(metricsRes.data);
      setLogs(logsRes.data);
      setTraces(tracesRes.data);
      setAlerts(alertsRes.data);
      setDashboards(dashboardsRes.data);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/monitoring/alerts/${alertId}/acknowledge`);
      loadMonitoringData(); // Refresh data
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await api.post(`/monitoring/alerts/${alertId}/resolve`);
      loadMonitoringData(); // Refresh data
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      case 'unknown': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'critical': return <Error color="error" />;
      case 'unknown': return <Info color="disabled" />;
      default: return <Info />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const renderSystemOverview = () => {
    const systemMetrics = metrics.system || {};
    const appMetrics = metrics.application || {};
    
    return (
      <Grid container spacing={3}>
        {/* System Health Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">CPU Usage</Typography>
              </Box>
              <Typography variant="h4" color={systemMetrics.cpu > 80 ? 'error' : 'primary'}>
                {systemMetrics.cpu?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.cpu || 0}
                color={systemMetrics.cpu > 80 ? 'error' : 'primary'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Memory color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory</Typography>
              </Box>
              <Typography variant="h4" color={systemMetrics.memory > 85 ? 'error' : 'primary'}>
                {systemMetrics.memory?.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatBytes(systemMetrics.memoryUsed || 0)} / {formatBytes(systemMetrics.memoryTotal || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Storage color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Disk Usage</Typography>
              </Box>
              <Typography variant="h4" color={systemMetrics.disk > 90 ? 'error' : 'primary'}>
                {systemMetrics.disk?.toFixed(1) || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={systemMetrics.disk || 0}
                color={systemMetrics.disk > 90 ? 'error' : 'primary'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NetworkCheck color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Network</Typography>
              </Box>
              <Typography variant="body2">
                In: {formatBytes(systemMetrics.networkIn || 0)}/s
              </Typography>
              <Typography variant="body2">
                Out: {formatBytes(systemMetrics.networkOut || 0)}/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requests/sec
              </Typography>
              <Typography variant="h4" color="primary">
                {appMetrics.requestRate || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  +12%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time
              </Typography>
              <Typography variant="h4" color="primary">
                {appMetrics.responseTime || 0}ms
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  -5%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate
              </Typography>
              <Typography variant="h4" color={appMetrics.errorRate > 5 ? 'error' : 'primary'}>
                {appMetrics.errorRate?.toFixed(2) || 0}%
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingDown color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  -2%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" color="primary">
                {appMetrics.activeUsers || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                  +8%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.systemTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8884d8" fill="#8884d8" name="CPU %" />
                  <Area type="monotone" dataKey="memory" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Memory %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.appTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#8884d8" name="Requests/sec" />
                  <Line yAxisId="right" type="monotone" dataKey="responseTime" stroke="#82ca9d" name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Health Status
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(metrics.services || {}).map(([service, status]) => (
                  <Grid item xs={12} sm={6} md={4} key={service}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(status.status)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {service}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {status.message}
                        </Typography>
                        {status.responseTime && (
                          <Typography variant="caption">
                            Response: {status.responseTime}ms
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderAlerts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">System Alerts</Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto Refresh"
            />
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadMonitoringData}>
              Refresh
            </Button>
          </Box>
        </Box>
        
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Alert</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Chip
                        label={alert.severity}
                        color={getSeverityColor(alert.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.ruleName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {alert.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        color={alert.status === 'active' ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(alert.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {alert.value} / {alert.threshold}
                    </TableCell>
                    <TableCell>
                      {alert.status === 'active' && (
                        <>
                          <Button
                            size="small"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => setAlertDialog({ open: true, alert })}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );

  const renderLogs = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">System Logs</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.logLevel}
                onChange={(e) => setFilters({ ...filters, logLevel: e.target.value })}
                label="Level"
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="ERROR">Error</MenuItem>
                <MenuItem value="WARN">Warning</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
                <MenuItem value="DEBUG">Debug</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Service</InputLabel>
              <Select
                value={filters.service}
                onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                label="Service"
              >
                <MenuItem value="all">All Services</MenuItem>
                <MenuItem value="api">API</MenuItem>
                <MenuItem value="database">Database</MenuItem>
                <MenuItem value="auth">Authentication</MenuItem>
                <MenuItem value="ml">ML Service</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<Search />}>
              Search
            </Button>
          </Box>
        </Box>
        
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.level}
                        color={
                          log.level === 'ERROR' ? 'error' :
                          log.level === 'WARN' ? 'warning' :
                          log.level === 'INFO' ? 'info' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.service}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setLogDialog({ open: true, log })}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTraces = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Distributed Traces
        </Typography>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Trace ID</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Spans</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {traces.map((trace) => (
                  <TableRow key={trace.traceId}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {trace.traceId.substring(0, 16)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{trace.operationName}</TableCell>
                    <TableCell>{trace.tags?.service || 'Unknown'}</TableCell>
                    <TableCell>{formatDuration(trace.duration)}</TableCell>
                    <TableCell>
                      <Chip
                        label={trace.status}
                        color={trace.status === 'completed' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{trace.spanCount || 1}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setTraceDialog({ open: true, trace })}
                      >
                        <Timeline />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Monitoring
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
              label="Time Range"
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Settings />}>
            Configure
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="System Overview" />
          <Tab 
            label={
              <Badge badgeContent={alerts.filter(a => a.status === 'active').length} color="error">
                Alerts
              </Badge>
            } 
          />
          <Tab label="Logs" />
          <Tab label="Traces" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderSystemOverview()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderAlerts()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderLogs()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderTraces()}
      </TabPanel>

      {/* Alert Details Dialog */}
      <Dialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, alert: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Alert Details - {alertDialog.alert?.ruleName}
        </DialogTitle>
        <DialogContent>
          {alertDialog.alert && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {alertDialog.alert.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Severity:</strong> {alertDialog.alert.severity}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Current Value:</strong> {alertDialog.alert.value}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Threshold:</strong> {alertDialog.alert.threshold}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created:</strong> {new Date(alertDialog.alert.createdAt).toLocaleString()}
              </Typography>
              {alertDialog.alert.metadata && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Additional Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre>{JSON.stringify(alertDialog.alert.metadata, null, 2)}</pre>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialog({ open: false, alert: null })}>
            Close
          </Button>
          {alertDialog.alert?.status === 'active' && (
            <>
              <Button onClick={() => acknowledgeAlert(alertDialog.alert.id)}>
                Acknowledge
              </Button>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => resolveAlert(alertDialog.alert.id)}
              >
                Resolve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Log Details Dialog */}
      <Dialog
        open={logDialog.open}
        onClose={() => setLogDialog({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Log Entry Details
        </DialogTitle>
        <DialogContent>
          {logDialog.log && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Timestamp:</strong> {new Date(logDialog.log.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Level:</strong> {logDialog.log.level}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Service:</strong> {logDialog.log.service}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Message:</strong>
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace' }}>
                {logDialog.log.message}
              </Paper>
              {logDialog.log.metadata && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Metadata</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre>{JSON.stringify(logDialog.log.metadata, null, 2)}</pre>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialog({ open: false, log: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trace Details Dialog */}
      <Dialog
        open={traceDialog.open}
        onClose={() => setTraceDialog({ open: false, trace: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Trace Details - {traceDialog.trace?.operationName}
        </DialogTitle>
        <DialogContent>
          {traceDialog.trace && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Trace ID:</strong> {traceDialog.trace.traceId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Duration:</strong> {formatDuration(traceDialog.trace.duration)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {traceDialog.trace.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Started:</strong> {new Date(traceDialog.trace.startTime).toLocaleString()}
              </Typography>
              
              {traceDialog.trace.logs && traceDialog.trace.logs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Trace Logs
                  </Typography>
                  <List>
                    {(traceDialog?.trace?.logs || []).map((log, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={log.message}
                          secondary={new Date(log.timestamp).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTraceDialog({ open: false, trace: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitoringDashboard;
