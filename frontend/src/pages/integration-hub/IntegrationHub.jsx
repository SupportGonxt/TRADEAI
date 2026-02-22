import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Tabs, Tab, LinearProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Hub as HubIcon, Edit as EditIcon, Sync as SyncIcon,
  History as LogIcon
} from '@mui/icons-material';
import { integrationHubService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const emptyIntegration = { name: '', description: '', integration_type: 'api', provider: 'custom', category: 'erp', status: 'inactive', endpoint_url: '', auth_type: 'api_key', sync_frequency: 'manual', notes: '' };

export default function IntegrationHub() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [integrations, setIntegrations] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyIntegration);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [logDialog, setLogDialog] = useState({ open: false, logs: [] });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, intRes, optRes] = await Promise.all([
        integrationHubService.getSummary(),
        integrationHubService.getIntegrations(),
        integrationHubService.getOptions()
      ]);
      if (sumRes.success) setSummary(sumRes.data || {});
      if (intRes.success) setIntegrations(intRes.data || []);
      if (optRes.success) setOptions(optRes.data || {});
    } catch (e) { setSnack({ open: true, message: 'Failed to load data', severity: 'error' }); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name || '', description: item.description || '', integration_type: item.integration_type || 'api', provider: item.provider || 'custom', category: item.category || 'erp', status: item.status || 'inactive', endpoint_url: item.endpoint_url || '', auth_type: item.auth_type || 'api_key', sync_frequency: item.sync_frequency || 'manual', notes: item.notes || '' } : emptyIntegration);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) { await integrationHubService.updateIntegration(editItem.id, form); }
      else { await integrationHubService.createIntegration(form); }
      setDialogOpen(false);
      setSnack({ open: true, message: editItem ? 'Updated' : 'Created', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this integration?')) return;
    try {
      await integrationHubService.deleteIntegration(id);
      setSnack({ open: true, message: 'Deleted', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleSync = async (id) => {
    try {
      await integrationHubService.syncIntegration(id);
      setSnack({ open: true, message: 'Sync completed', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleViewLogs = async (id) => {
    try {
      const res = await integrationHubService.getLogs(id);
      setLogDialog({ open: true, logs: res.data || [] });
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const statusColor = (s) => s === 'active' ? 'success' : s === 'error' ? 'error' : s === 'syncing' ? 'info' : 'default';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Integration Hub</Typography>
          <Typography variant="body2" color="text.secondary">Manage external system integrations and data sync</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined" size="small">Refresh</Button>
          <Button startIcon={<AddIcon />} onClick={() => openDialog()} variant="contained" size="small" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>New Integration</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Integrations" value={summary.total} /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Active" value={summary.active} color="#059669" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Errors" value={summary.errors} color="#DC2626" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Syncing" value={summary.syncing} color="#2563EB" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tab label="All Integrations" />
          <Tab label="ERP" />
          <Tab label="CRM" />
        </Tabs>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sync</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Sync</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tab === 0 ? integrations : tab === 1 ? integrations.filter(i => i.category === 'erp') : integrations.filter(i => i.category === 'crm')).map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><HubIcon sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography></Box></TableCell>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell><Chip label={item.category} size="small" /></TableCell>
                  <TableCell><Chip label={item.status} size="small" color={statusColor(item.status)} /></TableCell>
                  <TableCell>{item.sync_frequency}</TableCell>
                  <TableCell>{item.last_sync_at ? new Date(item.last_sync_at).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Sync Now"><IconButton size="small" onClick={() => handleSync(item.id)}><SyncIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Logs"><IconButton size="small" onClick={() => handleViewLogs(item.id)}><LogIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {integrations.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No integrations found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Integration' : 'New Integration'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required size="small" />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} size="small" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField select label="Type" value={form.integration_type} onChange={(e) => setForm({ ...form, integration_type: e.target.value })} fullWidth size="small">{(options.integrationTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField select label="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} fullWidth size="small">{(options.providers || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth size="small">{(options.categories || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth size="small"><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="error">Error</MenuItem></TextField></Grid>
          </Grid>
          <TextField label="Endpoint URL" value={form.endpoint_url} onChange={(e) => setForm({ ...form, endpoint_url: e.target.value })} fullWidth size="small" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField select label="Auth Type" value={form.auth_type} onChange={(e) => setForm({ ...form, auth_type: e.target.value })} fullWidth size="small"><MenuItem value="api_key">API Key</MenuItem><MenuItem value="oauth2">OAuth 2.0</MenuItem><MenuItem value="basic">Basic Auth</MenuItem></TextField></Grid>
            <Grid item xs={6}><TextField select label="Sync Frequency" value={form.sync_frequency} onChange={(e) => setForm({ ...form, sync_frequency: e.target.value })} fullWidth size="small">{(options.syncFrequencies || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
          </Grid>
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#7C3AED' }}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={logDialog.open} onClose={() => setLogDialog({ open: false, logs: [] })} maxWidth="md" fullWidth>
        <DialogTitle>Integration Logs</DialogTitle>
        <DialogContent>
          {logDialog.logs.length === 0 ? <Typography color="text.secondary" sx={{ py: 2 }}>No logs</Typography> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Action</TableCell><TableCell>Status</TableCell><TableCell>Records</TableCell><TableCell>Duration</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {logDialog.logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.log_type}</TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell><Chip label={l.status} size="small" color={l.status === 'success' ? 'success' : 'error'} /></TableCell>
                    <TableCell>{l.records_processed}</TableCell>
                    <TableCell>{l.duration_ms}ms</TableCell>
                    <TableCell>{l.created_at ? new Date(l.created_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setLogDialog({ open: false, logs: [] })}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
