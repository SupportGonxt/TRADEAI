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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Security,
  Shield,
  Warning,
  VpnKey,
  Person,
  AdminPanelSettings,
  Timeline,
  Refresh,
  Settings,
  Block,
  Lock,
  PhoneAndroid
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
  Cell
} from 'recharts';
import { securityService } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedSecurityDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Security data
  const [securityOverview, setSecurityOverview] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [, setAuditLogs] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  
  // MFA Setup
  const [mfaDialog, setMfaDialog] = useState(false);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  
  // Role Management
  const [roleDialog, setRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [],
    level: 1
  });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        dashboardRes,
        eventsRes,
        auditRes,
        rolesRes,
        permissionsRes
      ] = await Promise.all([
        securityService.getSecurityDashboard({ days: 30 }),
        securityService.getSecurityEvents({ limit: 50 }),
        securityService.getAuditLogs({ limit: 100 }),
        securityService.getRoles(),
        securityService.getPermissions()
      ]);

      setSecurityOverview(dashboardRes.data);
      setSecurityEvents(eventsRes.data || []);
      setAuditLogs(auditRes.data || []);
      // Sessions not supported by backend currently
      setUserSessions([]);
      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);

    } catch (err) {
      setError('Failed to load security data');
      console.error('Security data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const setupMFA = async () => {
    try {
      const response = await securityService.setupMFA();
      setMfaSetup(response.data);
      setMfaDialog(true);
    } catch (err) {
      setError('Failed to setup MFA');
      console.error('MFA setup error:', err);
    }
  };

  const enableMFA = async () => {
    try {
      await securityService.enableMFA(mfaToken);
      setMfaDialog(false);
      setMfaSetup(null);
      setMfaToken('');
      await loadSecurityData();
    } catch (err) {
      setError('Failed to enable MFA');
      console.error('MFA enable error:', err);
    }
  };

  const blockUser = async (userId) => {
    try {
      await securityService.blockUser(userId);
      await loadSecurityData();
    } catch (err) {
      setError('Failed to block user');
      console.error('Block user error:', err);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      await securityService.terminateSession(sessionId);
      await loadSecurityData();
    } catch (err) {
      setError('Failed to terminate session');
      console.error('Terminate session error:', err);
    }
  };

  const saveRole = async () => {
    try {
      if (selectedRole) {
        await securityService.updateRole((selectedRole.id || selectedRole._id), roleForm);
      } else {
        await securityService.createRole(roleForm);
      }
      
      setRoleDialog(false);
      setSelectedRole(null);
      setRoleForm({ name: '', description: '', permissions: [], level: 1 });
      await loadSecurityData();
      
    } catch (err) {
      setError('Failed to save role');
      console.error('Save role error:', err);
    }
  };

  const openRoleDialog = (role = null) => {
    if (role) {
      setSelectedRole(role);
      setRoleForm({
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => p.id || p._id),
        level: role.level
      });
    } else {
      setSelectedRole(null);
      setRoleForm({ name: '', description: '', permissions: [], level: 1 });
    }
    setRoleDialog(true);
  };

  const renderSecurityOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Security Score</Typography>
            </Box>
            <Typography variant="h3" color="primary" gutterBottom>
              {securityOverview?.securityScore || 0}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Overall Security Rating
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Warning sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Active Threats</Typography>
            </Box>
            <Typography variant="h3" color="warning.main" gutterBottom>
              {securityOverview?.activeThreats || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Require Attention
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Active Users</Typography>
            </Box>
            <Typography variant="h3" color="info.main" gutterBottom>
              {securityOverview?.activeUsers || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently Online
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Shield sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">MFA Enabled</Typography>
            </Box>
            <Typography variant="h3" color="success.main" gutterBottom>
              {securityOverview?.mfaEnabledUsers || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Users with MFA
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Security Events Chart */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Security Events Timeline
            </Typography>
            {securityOverview?.eventTimeline && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={securityOverview.eventTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="events" stroke="#8884d8" />
                  <Line type="monotone" dataKey="threats" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Event Types Distribution */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Event Types
            </Typography>
            {securityOverview?.eventTypes && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={securityOverview.eventTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(securityOverview?.eventTypes || []).map((entry, index) => (
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

  const renderSecurityEvents = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Security Events</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadSecurityData}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Event Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>User</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {securityEvents.map((event) => (
                <TableRow key={event.id || event._id}>
                  <TableCell>
                    {new Date(event.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.eventType}
                      size="small"
                      color={
                        event.eventType.includes('failed') ? 'error' :
                        event.eventType.includes('success') ? 'success' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.severity}
                      size="small"
                      color={
                        event.severity === 'critical' ? 'error' :
                        event.severity === 'high' ? 'warning' :
                        event.severity === 'medium' ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{event.details?.email || 'N/A'}</TableCell>
                  <TableCell>{event.ipAddress || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {JSON.stringify(event.details).substring(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {event.details?.userId && (
                      <Tooltip title="Block User">
                        <IconButton
                          size="small"
                          onClick={() => blockUser(event.details.userId)}
                        >
                          <Block />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderUserSessions = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Active User Sessions
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Login Time</TableCell>
                <TableCell>Last Activity</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>User Agent</TableCell>
                <TableCell>MFA Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userSessions.map((session) => (
                <TableRow key={session.id || session._id}>
                  <TableCell>{session.user?.email}</TableCell>
                  <TableCell>
                    {new Date(session.loginTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(session.lastActivity).toLocaleString()}
                  </TableCell>
                  <TableCell>{session.ipAddress}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {session.userAgent?.substring(0, 30)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={session.mfaVerified ? 'Verified' : 'Not Verified'}
                      size="small"
                      color={session.mfaVerified ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Terminate Session">
                      <IconButton
                        size="small"
                        onClick={() => terminateSession(session._id)}
                      >
                        <Lock />
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

  const renderRoleManagement = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Role Management</Typography>
          <Button
            variant="contained"
            startIcon={<AdminPanelSettings />}
            onClick={() => openRoleDialog()}
          >
            Create Role
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id || role._id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {role.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.level}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${role.permissions?.length || 0} permissions`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{role.userCount || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={role.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={role.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Role">
                      <IconButton
                        size="small"
                        onClick={() => openRoleDialog(role)}
                      >
                        <Settings />
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

  const renderMFASetup = () => (
    <Dialog open={mfaDialog} onClose={() => setMfaDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhoneAndroid sx={{ mr: 1 }} />
          Setup Multi-Factor Authentication
        </Box>
      </DialogTitle>
      <DialogContent>
        {mfaSetup && (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body1" gutterBottom>
              Scan this QR code with your authenticator app:
            </Typography>
            
            <Box sx={{ my: 3 }}>
              <img 
                src={mfaSetup.qrCode} 
                alt="MFA QR Code" 
                style={{ maxWidth: '200px', height: 'auto' }}
              />
            </Box>
            
            <Typography variant="body2" gutterBottom>
              Or enter this key manually:
            </Typography>
            <Typography variant="code" sx={{ 
              backgroundColor: 'grey.100', 
              p: 1, 
              borderRadius: 1,
              fontFamily: 'monospace'
            }}>
              {mfaSetup.manualEntryKey}
            </Typography>
            
            <TextField
              fullWidth
              label="Enter verification code"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              sx={{ mt: 3 }}
              inputProps={{ maxLength: 6 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setMfaDialog(false)}>Cancel</Button>
        <Button 
          onClick={enableMFA} 
          variant="contained"
          disabled={!mfaToken || mfaToken.length !== 6}
        >
          Enable MFA
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderRoleDialog = () => (
    <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedRole ? 'Edit Role' : 'Create New Role'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role Name"
              value={roleForm.name}
              onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Level"
              type="number"
              value={roleForm.level}
              onChange={(e) => setRoleForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={roleForm.description}
              onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={roleForm.permissions}
                onChange={(e) => setRoleForm(prev => ({ ...prev, permissions: e.target.value }))}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const permission = permissions.find(p => (p.id || p._id) === value);
                      return (
                        <Chip key={value} label={permission?.name} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {permissions.map((permission) => (
                  <MenuItem key={permission.id || permission._id} value={permission.id || permission._id}>
                    {permission.name} - {permission.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setRoleDialog(false)}>Cancel</Button>
        <Button onClick={saveRole} variant="contained">
          {selectedRole ? 'Update' : 'Create'}
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
        <Button variant="contained" onClick={loadSecurityData}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <Security sx={{ mr: 2 }} />
          Enhanced Security Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<VpnKey />}
          onClick={setupMFA}
        >
          Setup MFA
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" icon={<Timeline />} />
          <Tab label="Security Events" icon={<Warning />} />
          {/* User Sessions tab temporarily disabled until backend support exists */}
          {/* <Tab label="User Sessions" icon={<Person />} /> */}
          <Tab label="Role Management" icon={<AdminPanelSettings />} />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {activeTab === 0 && renderSecurityOverview()}
          {activeTab === 1 && renderSecurityEvents()}
          {activeTab === 2 && renderRoleManagement()}
        </>
      )}

      {renderMFASetup()}
      {renderRoleDialog()}
    </Box>
  );
};

export default EnhancedSecurityDashboard;