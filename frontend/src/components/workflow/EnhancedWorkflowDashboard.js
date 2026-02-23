import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import {
  AccountTree,
  PlayArrow,
  CheckCircle,
  Error,
  Schedule,
  Assignment,
  Visibility,
  Refresh,
  Timeline as TimelineIcon,
  Analytics,
  Speed
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { workflowService } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedWorkflowDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Workflow data
  const [workflowOverview, setWorkflowOverview] = useState(null);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [, setWorkflowTemplates] = useState([]);
  const [workflowAnalytics, setWorkflowAnalytics] = useState(null);
  
  // Dialogs
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewRes,
        activeRes,
        approvalsRes,
        templatesRes,
        analyticsRes
      ] = await Promise.all([
        workflowService.getWorkflowOverview(),
        workflowService.getActiveWorkflows(),
        workflowService.getPendingApprovals(),
        workflowService.getWorkflowTemplates(),
        workflowService.getWorkflowAnalytics()
      ]);

      setWorkflowOverview(overviewRes.data);
      setActiveWorkflows(activeRes.data || []);
      setPendingApprovals(approvalsRes.data || []);
      setWorkflowTemplates(templatesRes.data || []);
      setWorkflowAnalytics(analyticsRes.data);

    } catch (err) {
      setError('Failed to load workflow data');
      console.error('Workflow data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const startWorkflow = async (templateId, data) => {
    try {
      await workflowService.startWorkflow(templateId, data);
      await loadWorkflowData();
    } catch (err) {
      setError('Failed to start workflow');
      console.error('Start workflow error:', err);
    }
  };

  const handleApproval = async (action) => {
    try {
      await workflowService.handleUserAction(
        selectedApproval.instanceId,
        selectedApproval.stepId,
        action,
        { comment: approvalComment }
      );
      
      setApprovalDialog(false);
      setSelectedApproval(null);
      setApprovalComment('');
      await loadWorkflowData();
      
    } catch (err) {
      setError(`Failed to ${action} workflow`);
      console.error('Approval error:', err);
    }
  };

  const viewWorkflowDetails = async (instanceId) => {
    try {
      const response = await workflowService.getWorkflowStatus(instanceId);
      setSelectedWorkflow(response.data);
      setWorkflowDialog(true);
    } catch (err) {
      setError('Failed to load workflow details');
      console.error('Workflow details error:', err);
    }
  };

  const renderWorkflowOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountTree sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Active Workflows</Typography>
            </Box>
            <Typography variant="h3" color="primary" gutterBottom>
              {workflowOverview?.activeCount || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently Running
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assignment sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Pending Approvals</Typography>
            </Box>
            <Typography variant="h3" color="warning.main" gutterBottom>
              {workflowOverview?.pendingApprovals || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Awaiting Action
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Completed Today</Typography>
            </Box>
            <Typography variant="h3" color="success.main" gutterBottom>
              {workflowOverview?.completedToday || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Successfully Finished
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Avg. Completion</Typography>
            </Box>
            <Typography variant="h3" color="info.main" gutterBottom>
              {workflowOverview?.avgCompletionTime || 0}h
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Average Time
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Workflow Performance Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Performance Trends
            </Typography>
            {workflowOverview?.performanceTrend && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={workflowOverview.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#4caf50" name="Completed" />
                  <Line type="monotone" dataKey="started" stroke="#8B5CF6" name="Started" />
                  <Line type="monotone" dataKey="overdue" stroke="#f44336" name="Overdue" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* SLA Compliance */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              SLA Compliance
            </Typography>
            {workflowOverview?.slaCompliance && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={workflowOverview.slaCompliance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(workflowOverview?.slaCompliance || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderActiveWorkflows = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Active Workflows</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadWorkflowData}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Workflow</TableCell>
                <TableCell>Instance ID</TableCell>
                <TableCell>Current Step</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Started By</TableCell>
                <TableCell>SLA Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeWorkflows.map((workflow) => (
                <TableRow key={workflow.instanceId}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {workflow.workflowName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {workflow.instanceId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={workflow.currentStep?.name}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(workflow.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{workflow.startedBy}</TableCell>
                  <TableCell>
                    <Chip
                      label={workflow.sla?.isOverdue ? 'Overdue' : 'On Time'}
                      size="small"
                      color={workflow.sla?.isOverdue ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <div style={{
                          width: '100px',
                          height: '8px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(workflow.progress || 0) * 100}%`,
                            height: '100%',
                            backgroundColor: '#7C3AED',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {Math.round((workflow.progress || 0) * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => viewWorkflowDetails(workflow.instanceId)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderPendingApprovals = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pending Approvals
        </Typography>
        
        <List>
          {pendingApprovals.map((approval) => (
            <ListItem key={approval.instanceId} divider>
              <ListItemIcon>
                <Assignment color={approval.isOverdue ? 'error' : 'primary'} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {approval.workflowName}
                    </Typography>
                    {approval.isOverdue && (
                      <Chip label="Overdue" size="small" color="error" />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Step: {approval.stepName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Requested: {new Date(approval.requestedAt).toLocaleString()}
                    </Typography>
                    {approval.deadline && (
                      <Typography variant="body2" color="textSecondary">
                        Deadline: {new Date(approval.deadline).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedApproval(approval);
                    setApprovalDialog(true);
                  }}
                >
                  Review
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderWorkflowAnalytics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Types Performance
            </Typography>
            {workflowAnalytics?.workflowPerformance && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(workflowAnalytics.workflowPerformance).map(([type, data]) => ({
                  type,
                  count: data.count,
                  avgTime: data.averageTime,
                  slaCompliance: data.slaCompliance
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                  <Bar dataKey="avgTime" fill="#82ca9d" name="Avg Time (hours)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {workflowAnalytics?.totalWorkflows || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Workflows
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {workflowAnalytics?.slaCompliance?.toFixed(1) || 0}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    SLA Compliance
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {workflowAnalytics?.averageCompletionTime?.toFixed(1) || 0}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Completion Time
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {workflowAnalytics?.bottlenecks?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Bottlenecks
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderWorkflowDetails = () => (
    <Dialog open={workflowDialog} onClose={() => setWorkflowDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Workflow Details: {selectedWorkflow?.workflowName}
      </DialogTitle>
      <DialogContent>
        {selectedWorkflow && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Instance ID:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {selectedWorkflow.instanceId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status:</Typography>
                <Chip
                  label={selectedWorkflow.status}
                  size="small"
                  color={
                    selectedWorkflow.status === 'completed' ? 'success' :
                    selectedWorkflow.status === 'active' ? 'primary' : 'default'
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Started:</Typography>
                <Typography variant="body2">
                  {new Date(selectedWorkflow.startedAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Started By:</Typography>
                <Typography variant="body2">
                  {selectedWorkflow.startedBy}
                </Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Workflow History
            </Typography>
            <Timeline>
              {selectedWorkflow.history?.map((step, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="textSecondary">
                    {new Date(step.executedAt).toLocaleString()}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={
                      step.status === 'completed' ? 'success' :
                      step.status === 'failed' ? 'error' : 'primary'
                    }>
                      {step.status === 'completed' ? <CheckCircle /> :
                       step.status === 'failed' ? <Error /> : <Schedule />}
                    </TimelineDot>
                    {index < selectedWorkflow.history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle2">
                      {step.stepId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Status: {step.status}
                    </Typography>
                    {step.output && (
                      <Typography variant="body2" color="textSecondary">
                        Output: {JSON.stringify(step.output).substring(0, 100)}...
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setWorkflowDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderApprovalDialog = () => (
    <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        Review Approval Request
      </DialogTitle>
      <DialogContent>
        {selectedApproval && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {selectedApproval.workflowName}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Step: {selectedApproval.stepName}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Requested: {new Date(selectedApproval.requestedAt).toLocaleString()}
            </Typography>
            
            {selectedApproval.context && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Context:
                </Typography>
                <pre style={{ fontSize: '12px', margin: 0 }}>
                  {JSON.stringify(selectedApproval.context, null, 2)}
                </pre>
              </Box>
            )}

            <TextField
              fullWidth
              label="Comment (optional)"
              multiline
              rows={3}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
        <Button 
          onClick={() => handleApproval('reject')} 
          color="error"
          variant="outlined"
        >
          Reject
        </Button>
        <Button 
          onClick={() => handleApproval('approve')} 
          color="success"
          variant="contained"
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadWorkflowData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AccountTree sx={{ mr: 2 }} />
        Workflow Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" icon={<TimelineIcon />} />
          <Tab label="Active Workflows" icon={<PlayArrow />} />
          <Tab label="Pending Approvals" icon={<Assignment />} />
          <Tab label="Analytics" icon={<Analytics />} />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {activeTab === 0 && renderWorkflowOverview()}
          {activeTab === 1 && renderActiveWorkflows()}
          {activeTab === 2 && renderPendingApprovals()}
          {activeTab === 3 && renderWorkflowAnalytics()}
        </>
      )}

      {renderWorkflowDetails()}
      {renderApprovalDialog()}
    </Box>
  );
};

export default EnhancedWorkflowDashboard;