import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, MenuItem, Tabs, Tab, Alert, Snackbar, Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Notifications as NotifIcon, Rule as RuleIcon, History as HistoryIcon,
  MarkEmailRead as ReadIcon, DoneAll as ReadAllIcon, Close as DismissIcon,
  CheckCircle as AckIcon, Verified as ResolveIcon
} from '@mui/icons-material';
import { notificationCenterService } from '../../services/api';

const SummaryCard = ({ title, value, subtitle, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value ?? 0}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </CardContent>
  </Card>
);

const emptyNotif = { title: '', message: '', notification_type: 'info', category: 'system', priority: 'normal', channel: 'in_app' };
const emptyRule = { name: '', description: '', rule_type: 'threshold', category: 'system', severity: 'warning', metric: '', operator: '>', threshold_value: 0, frequency: 'daily' };
const emptyAlert = { title: '', message: '', alert_type: 'threshold', severity: 'warning', entity_type: '', entity_name: '' };

export default function NotificationCenter() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({});
  const [options, setOptions] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [formData, setFormData] = useState(emptyNotif);
  const [editId, setEditId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([notificationCenterService.getSummary(), notificationCenterService.getOptions()]);
      if (s.success) setSummary(s.data || {});
      if (o.success) setOptions(o.data || {});
      const [n, r, h] = await Promise.all([
        notificationCenterService.getNotifications(),
        notificationCenterService.getRules(),
        notificationCenterService.getHistory()
      ]);
      if (n.success) setNotifications(n.data || []);
      if (r.success) setRules(r.data || []);
      if (h.success) setHistory(h.data || []);
    } catch (e) { showSnack(e.message, 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateNotif = () => { setFormData(emptyNotif); setDialogMode('notification'); setDialogOpen(true); };
  const handleCreateRule = () => { setFormData(emptyRule); setDialogMode('rule'); setEditId(null); setDialogOpen(true); };
  const handleEditRule = (rule) => { setFormData(rule); setDialogMode('rule'); setEditId(rule.id); setDialogOpen(true); };
  const handleCreateAlert = () => { setFormData(emptyAlert); setDialogMode('alert'); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      if (dialogMode === 'notification') {
        await notificationCenterService.createNotification(formData);
        showSnack('Notification created');
      } else if (dialogMode === 'rule') {
        if (editId) { await notificationCenterService.updateRule(editId, formData); showSnack('Rule updated'); }
        else { await notificationCenterService.createRule(formData); showSnack('Rule created'); }
      } else if (dialogMode === 'alert') {
        await notificationCenterService.createAlert(formData);
        showSnack('Alert created');
      }
      setDialogOpen(false);
      loadData();
    } catch (e) { showSnack(e.message, 'error'); }
  };

  const handleMarkRead = async (id) => { try { await notificationCenterService.markRead(id); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleDismiss = async (id) => { try { await notificationCenterService.dismiss(id); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleMarkAllRead = async () => { try { await notificationCenterService.markAllRead(); showSnack('All marked as read'); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleDeleteNotif = async (id) => { try { await notificationCenterService.deleteNotification(id); showSnack('Deleted'); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleDeleteRule = async (id) => { try { await notificationCenterService.deleteRule(id); showSnack('Rule deleted'); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleAcknowledge = async (id) => { try { await notificationCenterService.acknowledgeAlert(id); showSnack('Acknowledged'); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleResolve = async (id) => { try { await notificationCenterService.resolveAlert(id); showSnack('Resolved'); loadData(); } catch (e) { showSnack(e.message, 'error'); } };
  const handleDeleteAlert = async (id) => { try { await notificationCenterService.deleteAlert(id); showSnack('Deleted'); loadData(); } catch (e) { showSnack(e.message, 'error'); } };

  const ns = summary.notifications || {};
  const rs = summary.rules || {};
  const as = summary.alerts || {};

  const priorityColor = (p) => ({ critical: 'error', high: 'warning', normal: 'info', low: 'default' }[p] || 'default');
  const severityColor = (s) => ({ critical: 'error', warning: 'warning', info: 'info' }[s] || 'default');
  const statusColor = (s) => ({ unread: 'warning', read: 'success', dismissed: 'default', triggered: 'error', acknowledged: 'warning', resolved: 'success' }[s] || 'default');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Notification Center & Alerts</Typography>
          <Typography variant="body2" color="text.secondary">Manage notifications, alert rules, and alert history</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<ReadAllIcon />} onClick={handleMarkAllRead} variant="outlined" size="small">Mark All Read</Button>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined" size="small">Refresh</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Total Notifications" value={ns.total} subtitle={`${ns.unread || 0} unread`} /></Grid>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="High Priority" value={ns.high_priority} color="#F59E0B" /></Grid>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Alert Rules" value={rs.total} subtitle={`${rs.active || 0} active`} color="#10B981" /></Grid>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Alerts Triggered" value={as.total} subtitle={`${as.triggered || 0} open`} color="#EF4444" /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<NotifIcon />} label="Notifications" iconPosition="start" />
        <Tab icon={<RuleIcon />} label="Alert Rules" iconPosition="start" />
        <Tab icon={<HistoryIcon />} label="Alert History" iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={handleCreateNotif}>New Notification</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No notifications</Typography></TableCell></TableRow>
                ) : notifications.map((n) => (
                  <TableRow key={n.id} hover>
                    <TableCell>{n.title}</TableCell>
                    <TableCell><Chip label={n.notification_type || 'info'} size="small" /></TableCell>
                    <TableCell>{n.category}</TableCell>
                    <TableCell><Chip label={n.priority || 'normal'} size="small" color={priorityColor(n.priority)} /></TableCell>
                    <TableCell><Chip label={n.status || 'unread'} size="small" color={statusColor(n.status)} /></TableCell>
                    <TableCell>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="Mark Read"><IconButton size="small" onClick={() => handleMarkRead(n.id)}><ReadIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Dismiss"><IconButton size="small" onClick={() => handleDismiss(n.id)}><DismissIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteNotif(n.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={handleCreateRule}>New Rule</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No alert rules</Typography></TableCell></TableRow>
                ) : rules.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.name}</TableCell>
                    <TableCell><Chip label={r.rule_type} size="small" /></TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.metric || '-'}</TableCell>
                    <TableCell>{r.operator} {r.threshold_value}{r.threshold_unit || ''}</TableCell>
                    <TableCell><Chip label={r.severity} size="small" color={severityColor(r.severity)} /></TableCell>
                    <TableCell><Chip label={r.is_active ? 'Active' : 'Inactive'} size="small" color={r.is_active ? 'success' : 'default'} /></TableCell>
                    <TableCell>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditRule(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteRule(r.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={handleCreateAlert}>New Alert</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No alert history</Typography></TableCell></TableRow>
                ) : history.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell>{h.title}</TableCell>
                    <TableCell><Chip label={h.alert_type} size="small" /></TableCell>
                    <TableCell><Chip label={h.severity} size="small" color={severityColor(h.severity)} /></TableCell>
                    <TableCell>{h.entity_name || h.entity_type || '-'}</TableCell>
                    <TableCell>{h.metric_value ?? '-'}</TableCell>
                    <TableCell><Chip label={h.status} size="small" color={statusColor(h.status)} /></TableCell>
                    <TableCell>{h.created_at ? new Date(h.created_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Tooltip title="Acknowledge"><IconButton size="small" onClick={() => handleAcknowledge(h.id)} disabled={h.status !== 'triggered'}><AckIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Resolve"><IconButton size="small" onClick={() => handleResolve(h.id)} disabled={h.status === 'resolved'}><ResolveIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteAlert(h.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'notification' ? 'Create Notification' : dialogMode === 'rule' ? (editId ? 'Edit Alert Rule' : 'Create Alert Rule') : 'Create Alert'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {dialogMode === 'notification' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth required />
              <TextField label="Message" value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} fullWidth multiline rows={3} />
              <TextField select label="Type" value={formData.notification_type || 'info'} onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })} fullWidth>
                {(options.notificationTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField select label="Category" value={formData.category || 'system'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth>
                {(options.categories || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField select label="Priority" value={formData.priority || 'normal'} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} fullWidth>
                {(options.priorities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Box>
          )}
          {dialogMode === 'rule' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Rule Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required />
              <TextField label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
              <TextField select label="Rule Type" value={formData.rule_type || 'threshold'} onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })} fullWidth>
                {(options.ruleTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField label="Metric" value={formData.metric || ''} onChange={(e) => setFormData({ ...formData, metric: e.target.value })} fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField select label="Operator" value={formData.operator || '>'} onChange={(e) => setFormData({ ...formData, operator: e.target.value })} fullWidth>
                  {['>', '<', '>=', '<=', '=', '!='].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField></Grid>
                <Grid item xs={8}><TextField label="Threshold" type="number" value={formData.threshold_value || 0} onChange={(e) => setFormData({ ...formData, threshold_value: parseFloat(e.target.value) })} fullWidth /></Grid>
              </Grid>
              <TextField select label="Severity" value={formData.severity || 'warning'} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} fullWidth>
                {(options.severities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Box>
          )}
          {dialogMode === 'alert' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth required />
              <TextField label="Message" value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} fullWidth multiline rows={3} />
              <TextField select label="Severity" value={formData.severity || 'warning'} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} fullWidth>
                {(options.severities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField label="Entity Type" value={formData.entity_type || ''} onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })} fullWidth />
              <TextField label="Entity Name" value={formData.entity_name || ''} onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })} fullWidth />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
