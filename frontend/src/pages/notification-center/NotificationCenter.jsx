import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, LinearProgress, Alert, Snackbar, alpha, Switch, FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Notifications as NotifIcon, Rule as RuleIcon, History as HistoryIcon,
  Edit as EditIcon, DoneAll as ReadAllIcon, Visibility as ReadIcon,
  CheckCircle as AckIcon, Done as ResolveIcon
} from '@mui/icons-material';
import { notificationCenterService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>{title}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color, mt: 0.5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const emptyNotif = { title: '', message: '', notificationType: 'info', category: 'system', priority: 'normal', channel: 'in_app', notes: '' };
const emptyRule = { name: '', description: '', ruleType: 'threshold', category: 'budget', entityType: '', metric: '', operator: 'greater_than', thresholdValue: 0, thresholdUnit: 'absolute', severity: 'warning', isActive: true, frequency: 'real_time', cooldownMinutes: 60, notes: '' };
const emptyAlert = { title: '', message: '', alertType: 'threshold', severity: 'warning', entityType: '', entityName: '', metricValue: 0, thresholdValue: 0, notes: '' };

export default function NotificationCenter() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, type: '', mode: 'create', data: {} });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, notRes, rulRes, hisRes] = await Promise.all([
        notificationCenterService.getSummary().catch(() => ({ data: {} })),
        notificationCenterService.getNotifications().catch(() => ({ data: [] })),
        notificationCenterService.getRules().catch(() => ({ data: [] })),
        notificationCenterService.getHistory().catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data || {});
      setNotifications(notRes.data || []);
      setRules(rulRes.data || []);
      setHistory(hisRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (type, mode = 'create', data = null) => {
    const defaults = type === 'notification' ? emptyNotif : type === 'rule' ? emptyRule : emptyAlert;
    setDialog({ open: true, type, mode, data: data || { ...defaults } });
  };

  const handleSave = async () => {
    try {
      const { type, mode, data } = dialog;
      if (type === 'notification') {
        await notificationCenterService.createNotification(data);
      } else if (type === 'rule') {
        if (mode === 'edit') await notificationCenterService.updateRule(data.id, data);
        else await notificationCenterService.createRule(data);
      } else {
        await notificationCenterService.createAlert(data);
      }
      setDialog({ open: false, type: '', mode: 'create', data: {} });
      setSnack({ open: true, message: `${type} saved`, severity: 'success' });
      loadData();
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Error saving', severity: 'error' });
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'notification') await notificationCenterService.deleteNotification(id);
      else if (type === 'rule') await notificationCenterService.deleteRule(id);
      else await notificationCenterService.deleteAlert(id);
      setSnack({ open: true, message: 'Deleted', severity: 'success' });
      loadData();
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Error', severity: 'error' });
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationCenterService.markRead(id);
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationCenterService.markAllRead();
      setSnack({ open: true, message: 'All marked read', severity: 'success' });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleAcknowledge = async (id) => {
    try {
      await notificationCenterService.acknowledgeAlert(id);
      setSnack({ open: true, message: 'Acknowledged', severity: 'success' });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleResolve = async (id) => {
    try {
      await notificationCenterService.resolveAlert(id);
      setSnack({ open: true, message: 'Resolved', severity: 'success' });
      loadData();
    } catch (e) { console.error(e); }
  };

  const priorityColor = (p) => {
    if (p === 'urgent') return '#DC2626';
    if (p === 'high') return '#F59E0B';
    if (p === 'normal') return '#3B82F6';
    return '#6B7280';
  };

  const sevColor = (s) => {
    if (s === 'critical') return '#DC2626';
    if (s === 'warning') return '#F59E0B';
    return '#6B7280';
  };

  const { data: d } = dialog;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Notification Center & Alerts</Typography>
          <Typography variant="body2" color="text.secondary">Manage notifications, alert rules, and alert history</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {tab === 0 && <Button variant="outlined" startIcon={<ReadAllIcon />} onClick={handleMarkAllRead} size="small">Mark All Read</Button>}
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog(tab === 0 ? 'notification' : tab === 1 ? 'rule' : 'alert')} size="small"
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add {tab === 0 ? 'Notification' : tab === 1 ? 'Rule' : 'Alert'}
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><SummaryCard title="Total Notifications" value={summary.totalNotifications || 0} /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Unread" value={summary.unreadCount || 0} color="#F59E0B" /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Alert Rules" value={summary.totalRules || 0} color="#3B82F6" /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Active Alerts" value={summary.activeAlerts || 0} color="#EF4444" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab icon={<NotifIcon />} iconPosition="start" label="Notifications" />
          <Tab icon={<RuleIcon />} iconPosition="start" label="Alert Rules" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Alert History" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id} hover sx={{ bgcolor: n.status === 'unread' ? alpha('#7C3AED', 0.03) : 'transparent' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={n.status === 'unread' ? 700 : 400}>{n.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{n.message || ''}</Typography>
                    </TableCell>
                    <TableCell><Chip label={n.notificationType} size="small" /></TableCell>
                    <TableCell><Chip label={n.category} size="small" variant="outlined" /></TableCell>
                    <TableCell><Chip label={n.priority} size="small" sx={{ bgcolor: alpha(priorityColor(n.priority), 0.1), color: priorityColor(n.priority) }} /></TableCell>
                    <TableCell><Chip label={n.status} size="small" color={n.status === 'unread' ? 'warning' : 'default'} /></TableCell>
                    <TableCell>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</TableCell>
                    <TableCell align="center">
                      {n.status === 'unread' && <IconButton size="small" onClick={() => handleMarkRead(n.id)} title="Mark read"><ReadIcon fontSize="small" /></IconButton>}
                      <IconButton size="small" color="error" onClick={() => handleDelete('notification', n.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {notifications.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No notifications yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Metric / Threshold</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Triggers</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.description || ''}</Typography>
                    </TableCell>
                    <TableCell><Chip label={r.ruleType} size="small" /></TableCell>
                    <TableCell><Chip label={r.category} size="small" variant="outlined" /></TableCell>
                    <TableCell>{r.metric || '—'} {r.operator} {r.thresholdValue}</TableCell>
                    <TableCell><Chip label={r.severity} size="small" sx={{ bgcolor: alpha(sevColor(r.severity), 0.1), color: sevColor(r.severity) }} /></TableCell>
                    <TableCell><Chip label={r.isActive ? 'Active' : 'Inactive'} size="small" color={r.isActive ? 'success' : 'default'} /></TableCell>
                    <TableCell>{r.triggerCount || 0}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openDialog('rule', 'edit', r)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete('rule', r.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No alert rules yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Alert</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Metric / Threshold</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{h.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{h.message || ''}</Typography>
                    </TableCell>
                    <TableCell><Chip label={h.severity} size="small" sx={{ bgcolor: alpha(sevColor(h.severity), 0.1), color: sevColor(h.severity) }} /></TableCell>
                    <TableCell>{h.entityName || h.entityType || '—'}</TableCell>
                    <TableCell>{h.metricValue != null ? `${h.metricValue} / ${h.thresholdValue}` : '—'}</TableCell>
                    <TableCell><Chip label={h.status} size="small" color={h.status === 'resolved' ? 'success' : h.status === 'acknowledged' ? 'warning' : 'error'} /></TableCell>
                    <TableCell>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</TableCell>
                    <TableCell align="center">
                      {h.status === 'active' && <IconButton size="small" onClick={() => handleAcknowledge(h.id)} title="Acknowledge"><AckIcon fontSize="small" /></IconButton>}
                      {(h.status === 'active' || h.status === 'acknowledged') && <IconButton size="small" onClick={() => handleResolve(h.id)} title="Resolve" color="success"><ResolveIcon fontSize="small" /></IconButton>}
                      <IconButton size="small" color="error" onClick={() => handleDelete('alert', h.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No alert history yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'edit' ? 'Edit' : 'New'} {dialog.type}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {dialog.type === 'notification' && (
            <>
              <TextField label="Title" value={d.title || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, title: e.target.value } })} fullWidth size="small" />
              <TextField label="Message" value={d.message || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, message: e.target.value } })} fullWidth size="small" multiline rows={2} />
              <TextField label="Type" value={d.notificationType || 'info'} onChange={(e) => setDialog({ ...dialog, data: { ...d, notificationType: e.target.value } })} select fullWidth size="small">
                {['info', 'warning', 'error', 'success', 'action_required'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Category" value={d.category || 'system'} onChange={(e) => setDialog({ ...dialog, data: { ...d, category: e.target.value } })} select fullWidth size="small">
                {['system', 'budget', 'promotion', 'claim', 'deduction', 'approval', 'settlement', 'alert'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Priority" value={d.priority || 'normal'} onChange={(e) => setDialog({ ...dialog, data: { ...d, priority: e.target.value } })} select fullWidth size="small">
                {['low', 'normal', 'high', 'urgent'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Notes" value={d.notes || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, notes: e.target.value } })} fullWidth size="small" multiline rows={2} />
            </>
          )}
          {dialog.type === 'rule' && (
            <>
              <TextField label="Name" value={d.name || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, name: e.target.value } })} fullWidth size="small" />
              <TextField label="Description" value={d.description || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, description: e.target.value } })} fullWidth size="small" multiline rows={2} />
              <TextField label="Rule Type" value={d.ruleType || 'threshold'} onChange={(e) => setDialog({ ...dialog, data: { ...d, ruleType: e.target.value } })} select fullWidth size="small">
                {['threshold', 'anomaly', 'schedule', 'event', 'composite'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Category" value={d.category || 'budget'} onChange={(e) => setDialog({ ...dialog, data: { ...d, category: e.target.value } })} select fullWidth size="small">
                {['budget', 'promotion', 'claim', 'deduction', 'settlement', 'trade_spend'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Metric" value={d.metric || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, metric: e.target.value } })} fullWidth size="small" placeholder="e.g. budget_utilization" />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField label="Operator" value={d.operator || 'greater_than'} onChange={(e) => setDialog({ ...dialog, data: { ...d, operator: e.target.value } })} select fullWidth size="small">
                    {['greater_than', 'less_than', 'equals', 'not_equals', 'between'].map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={4}>
                  <TextField label="Threshold" type="number" value={d.thresholdValue || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, thresholdValue: parseFloat(e.target.value) } })} fullWidth size="small" />
                </Grid>
                <Grid item xs={4}>
                  <TextField label="Unit" value={d.thresholdUnit || 'absolute'} onChange={(e) => setDialog({ ...dialog, data: { ...d, thresholdUnit: e.target.value } })} select fullWidth size="small">
                    {['absolute', 'percentage', 'currency'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
              <TextField label="Severity" value={d.severity || 'warning'} onChange={(e) => setDialog({ ...dialog, data: { ...d, severity: e.target.value } })} select fullWidth size="small">
                {['info', 'warning', 'critical'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Frequency" value={d.frequency || 'real_time'} onChange={(e) => setDialog({ ...dialog, data: { ...d, frequency: e.target.value } })} select fullWidth size="small">
                {['real_time', 'hourly', 'daily', 'weekly'].map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
              <FormControlLabel control={<Switch checked={d.isActive !== false} onChange={(e) => setDialog({ ...dialog, data: { ...d, isActive: e.target.checked } })} />} label="Active" />
              <TextField label="Notes" value={d.notes || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, notes: e.target.value } })} fullWidth size="small" multiline rows={2} />
            </>
          )}
          {dialog.type === 'alert' && (
            <>
              <TextField label="Title" value={d.title || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, title: e.target.value } })} fullWidth size="small" />
              <TextField label="Message" value={d.message || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, message: e.target.value } })} fullWidth size="small" multiline rows={2} />
              <TextField label="Severity" value={d.severity || 'warning'} onChange={(e) => setDialog({ ...dialog, data: { ...d, severity: e.target.value } })} select fullWidth size="small">
                {['info', 'warning', 'critical'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Entity Type" value={d.entityType || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, entityType: e.target.value } })} fullWidth size="small" />
              <TextField label="Entity Name" value={d.entityName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, entityName: e.target.value } })} fullWidth size="small" />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Metric Value" type="number" value={d.metricValue || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, metricValue: parseFloat(e.target.value) } })} fullWidth size="small" /></Grid>
                <Grid item xs={6}><TextField label="Threshold Value" type="number" value={d.thresholdValue || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, thresholdValue: parseFloat(e.target.value) } })} fullWidth size="small" /></Grid>
              </Grid>
              <TextField label="Notes" value={d.notes || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, notes: e.target.value } })} fullWidth size="small" multiline rows={2} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
