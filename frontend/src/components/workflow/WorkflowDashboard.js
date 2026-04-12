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
  Chip,
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error,
  Schedule,
  Visibility,
  Edit,
  Add,
  Timeline,
  AccountTree,
  Task,
  Approval,
  History
} from '@mui/icons-material';
import {PieChart, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line} from 'recharts';
import api from '../../services/api';
import { useToast } from '../common/ToastNotification';

const WorkflowDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [workflows, setWorkflows] = useState([]);
  const [workflowInstances, setWorkflowInstances] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [createDialog, setCreateDialog] = useState({ open: false, type: 'workflow' });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, data: null });
  const [loading, setLoading] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({});
  const [taskStats, setTaskStats] = useState({});

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, instancesRes, tasksRes, statsRes] = await Promise.all([
        api.get('/workflow-engine'),
        api.get('/workflow-engine/instances'),
        api.get('/workflow-engine/tasks'),
        api.get('/workflow-engine/stats')
      ]);

      setWorkflows(workflowsRes.data);
      setWorkflowInstances(instancesRes.data);
      setTasks(tasksRes.data);
      setWorkflowStats(statsRes.data.workflows);
      setTaskStats(statsRes.data.tasks);
    } catch (error) {
      console.error('Error loading workflow data:', error);
      toast.error('Error loading workflow data');
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async (workflowId, data) => {
    try {
      const response = await api.post('/workflow-engine/instances', { template_id: workflowId, ...data });
      loadWorkflowData(); // Refresh data
      return response.data;
    } catch (error) {
      console.error('Error starting workflow:', error);
      toast.error('Error starting workflow');
    }
  };

  const completeTask = async (taskId, data) => {
    try {
      await api.put(`/workflow-engine/steps/${taskId}/complete`, data);
      loadWorkflowData(); // Refresh data
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error completing task');
    }
  };

  const approveTask = async (taskId, approved, comments) => {
    try {
      await api.put(`/workflow-engine/steps/${taskId}/${approved ? 'complete' : 'reject'}`, {
        action: approved ? 'approved' : 'rejected',
        comments
      });
      loadWorkflowData(); // Refresh data
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Error approving task');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'running': return <PlayArrow color="primary" />;
      case 'pending': return <Schedule color="warning" />;
      case 'failed': return <Error color="error" />;
      case 'cancelled': return <Stop color="disabled" />;
      default: return <Schedule />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountTree color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Active Workflows</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {workflowStats.active || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently running
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Task color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Pending Tasks</Typography>
            </Box>
            <Typography variant="h4" color="warning.main">
              {taskStats.pending || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Awaiting action
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Approval color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Approvals</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {taskStats.approvals || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Require approval
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Completed</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {workflowStats.completed || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This month
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Running', value: workflowStats.running || 0, fill: '#1E40AF' },
                    { name: 'Completed', value: workflowStats.completed || 0, fill: '#2e7d32' },
                    { name: 'Pending', value: workflowStats.pending || 0, fill: '#ed6c02' },
                    { name: 'Failed', value: workflowStats.failed || 0, fill: '#d32f2f' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Task Completion Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskStats.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#2e7d32" name="Completed" />
                <Line type="monotone" dataKey="created" stroke="#1E40AF" name="Created" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Workflow Activity
            </Typography>
            <List>
              {workflowInstances.slice(0, 5).map((instance, index) => (
                <React.Fragment key={instance.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getStatusIcon(instance.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${instance.workflowName} - ${instance.id}`}
                      secondary={`${instance.status} • Started ${new Date(instance.startTime).toLocaleString()}`}
                    />
                    <Chip
                      label={instance.status}
                      color={getStatusColor(instance.status)}
                      size="small"
                    />
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderWorkflows = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Workflow Templates</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog({ open: true, type: 'workflow' })}
          >
            Create Workflow
          </Button>
        </Box>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Steps</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Instances</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>{workflow.name}</TableCell>
                    <TableCell>{workflow.description}</TableCell>
                    <TableCell>{workflow.steps?.length || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={workflow.status}
                        color={workflow.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={workflow.instanceCount || 0} color="primary">
                        <Timeline />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setDetailsDialog({ open: true, data: workflow })}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => startWorkflow(workflow.id, {})}
                      >
                        <PlayArrow />
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

  const renderInstances = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Workflow Instances
        </Typography>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Instance ID</TableCell>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workflowInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>{instance.id}</TableCell>
                    <TableCell>{instance.workflowName}</TableCell>
                    <TableCell>
                      <Chip
                        label={instance.status}
                        color={getStatusColor(instance.status)}
                        size="small"
                        icon={getStatusIcon(instance.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={instance.progress || 0}
                          sx={{ width: 100, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {instance.progress || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(instance.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {instance.endTime ? 
                        formatDuration(new Date(instance.endTime) - new Date(instance.startTime)) :
                        formatDuration(Date.now() - new Date(instance.startTime))
                      }
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedInstance(instance)}
                      >
                        <Visibility />
                      </IconButton>
                      {instance.status === 'running' && (
                        <IconButton size="small">
                          <Pause />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      {selectedInstance && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workflow Steps - {selectedInstance.workflowName}
              </Typography>
              <Stepper orientation="vertical" activeStep={selectedInstance.currentStep || 0}>
                {selectedInstance.steps?.map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      optional={
                        step.status === 'failed' ? (
                          <Typography variant="caption" color="error">
                            Failed
                          </Typography>
                        ) : null
                      }
                      error={step.status === 'failed'}
                    >
                      {step.name}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="textSecondary">
                        {step.description}
                      </Typography>
                      {step.assignee && (
                        <Typography variant="body2">
                          Assigned to: {step.assignee}
                        </Typography>
                      )}
                      {step.completedAt && (
                        <Typography variant="body2">
                          Completed: {new Date(step.completedAt).toLocaleString()}
                        </Typography>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderTasks = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          My Tasks
        </Typography>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {task.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {task.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{task.workflowName}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </TableCell>
                    <TableCell>
                      {task.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => completeTask(task.id, { completed: true })}
                            sx={{ mr: 1 }}
                          >
                            Complete
                          </Button>
                          {task.requiresApproval && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => approveTask(task.id, true, '')}
                                sx={{ mr: 1 }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => approveTask(task.id, false, '')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      <IconButton size="small">
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Workflow Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<History />}>
            View History
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Quick Start
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Workflows" />
          <Tab label="Instances" />
          <Tab 
            label={
              <Badge badgeContent={tasks.filter(t => t.status === 'pending').length} color="error">
                My Tasks
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderWorkflows()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderInstances()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderTasks()}
      </TabPanel>

      {/* Workflow Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Workflow Details - {detailsDialog.data?.name}
        </DialogTitle>
        <DialogContent>
          {detailsDialog.data && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Description:</strong> {detailsDialog.data.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {detailsDialog.data.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Created:</strong> {new Date(detailsDialog.data.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Steps:
              </Typography>
              <List>
                {detailsDialog.data.steps?.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={step.name}
                      secondary={step.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, data: null })}>
            Close
          </Button>
          <Button variant="contained" startIcon={<PlayArrow />}>
            Start Instance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Workflow Dialog */}
      <Dialog
        open={createDialog.open}
        onClose={() => setCreateDialog({ open: false, type: 'workflow' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Workflow
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workflow Name"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Template</InputLabel>
            <Select label="Template">
              <MenuItem value="promotion_approval">Promotion Approval</MenuItem>
              <MenuItem value="budget_allocation">Budget Allocation</MenuItem>
              <MenuItem value="customer_onboarding">Customer Onboarding</MenuItem>
              <MenuItem value="custom">Custom Workflow</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog({ open: false, type: 'workflow' })}>
            Cancel
          </Button>
          <Button variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowDashboard;
