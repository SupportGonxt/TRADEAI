import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Tabs, Tab, LinearProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Settings as ConfigIcon, Edit as EditIcon, Business as TenantIcon
} from '@mui/icons-material';
import { systemConfigService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const emptyConfig = { config_key: '', config_value: '', config_type: 'string', category: 'general', module: '', description: '' };
const emptyTenant = { name: '', code: '', domain: '', status: 'active', plan: 'standard', max_users: 50, contact_name: '', contact_email: '', country: '', currency: 'ZAR', notes: '' };

export default function SystemConfig() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [configs, setConfigs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('config');
  const [editItem, setEditItem] = useState(null);
  const [configForm, setConfigForm] = useState(emptyConfig);
  const [tenantForm, setTenantForm] = useState(emptyTenant);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, confRes, tenRes, optRes] = await Promise.all([
        systemConfigService.getSummary(),
        systemConfigService.getConfigs(),
        systemConfigService.getTenants(),
        systemConfigService.getOptions()
      ]);
      if (sumRes.success) setSummary(sumRes.data || {});
      if (confRes.success) setConfigs(confRes.data || []);
      if (tenRes.success) setTenants(tenRes.data || []);
      if (optRes.success) setOptions(optRes.data || {});
    } catch (e) { setSnack({ open: true, message: 'Failed to load data', severity: 'error' }); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openConfigDialog = (item = null) => {
    setDialogType('config');
    setEditItem(item);
    setConfigForm(item ? { config_key: item.config_key || '', config_value: item.config_value || '', config_type: item.config_type || 'string', category: item.category || 'general', module: item.module || '', description: item.description || '' } : emptyConfig);
    setDialogOpen(true);
  };

  const openTenantDialog = (item = null) => {
    setDialogType('tenant');
    setEditItem(item);
    setTenantForm(item ? { name: item.name || '', code: item.code || '', domain: item.domain || '', status: item.status || 'active', plan: item.plan || 'standard', max_users: item.max_users || 50, contact_name: item.contact_name || '', contact_email: item.contact_email || '', country: item.country || '', currency: item.currency || 'ZAR', notes: item.notes || '' } : emptyTenant);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'config') {
        if (editItem) { await systemConfigService.updateConfig(editItem.id, configForm); }
        else { await systemConfigService.createConfig(configForm); }
      } else {
        if (editItem) { await systemConfigService.updateTenant(editItem.id, tenantForm); }
        else { await systemConfigService.createTenant(tenantForm); }
      }
      setDialogOpen(false);
      setSnack({ open: true, message: editItem ? 'Updated' : 'Created', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Delete this config?')) return;
    try { await systemConfigService.deleteConfig(id); setSnack({ open: true, message: 'Deleted', severity: 'success' }); loadData(); } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('Delete this tenant?')) return;
    try { await systemConfigService.deleteTenant(id); setSnack({ open: true, message: 'Deleted', severity: 'success' }); loadData(); } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>System Configuration</Typography>
          <Typography variant="body2" color="text.secondary">Manage system settings and tenant configuration</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined" size="small">Refresh</Button>
          <Button startIcon={<AddIcon />} onClick={() => tab === 0 ? openConfigDialog() : openTenantDialog()} variant="contained" size="small" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>{tab === 0 ? 'New Config' : 'New Tenant'}</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Config Items" value={summary.config?.total} /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Categories" value={summary.config?.categories} color="#2563EB" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Tenants" value={summary.tenants?.total} color="#059669" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Active Tenants" value={summary.tenants?.active} color="#D97706" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tab label="Configuration" />
          <Tab label="Tenants" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {configs.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ConfigIcon sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{c.config_key}</Typography></Box></TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.is_sensitive ? '******' : c.config_value}</Typography></TableCell>
                    <TableCell><Chip label={c.config_type} size="small" /></TableCell>
                    <TableCell>{c.category}</TableCell>
                    <TableCell>{c.module || '-'}</TableCell>
                    <TableCell align="right">
                      {!c.is_readonly && <><Tooltip title="Edit"><IconButton size="small" onClick={() => openConfigDialog(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteConfig(c.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip></>}
                    </TableCell>
                  </TableRow>
                ))}
                {configs.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No configurations found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TenantIcon sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography></Box></TableCell>
                    <TableCell>{t.code || '-'}</TableCell>
                    <TableCell><Chip label={t.plan} size="small" color={t.plan === 'enterprise' ? 'primary' : 'default'} /></TableCell>
                    <TableCell><Chip label={t.status} size="small" color={t.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{t.max_users}</TableCell>
                    <TableCell>{t.currency}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openTenantDialog(t)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteTenant(t.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No tenants found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'New'} {dialogType === 'config' ? 'Configuration' : 'Tenant'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {dialogType === 'config' ? (<>
            <TextField label="Key" value={configForm.config_key} onChange={(e) => setConfigForm({ ...configForm, config_key: e.target.value })} fullWidth required size="small" disabled={!!editItem} />
            <TextField label="Value" value={configForm.config_value} onChange={(e) => setConfigForm({ ...configForm, config_value: e.target.value })} fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField select label="Type" value={configForm.config_type} onChange={(e) => setConfigForm({ ...configForm, config_type: e.target.value })} fullWidth size="small">{(options.configTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select label="Category" value={configForm.category} onChange={(e) => setConfigForm({ ...configForm, category: e.target.value })} fullWidth size="small">{(options.categories || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
            </Grid>
            <TextField label="Module" value={configForm.module} onChange={(e) => setConfigForm({ ...configForm, module: e.target.value })} fullWidth size="small" />
            <TextField label="Description" value={configForm.description} onChange={(e) => setConfigForm({ ...configForm, description: e.target.value })} fullWidth multiline rows={2} size="small" />
          </>) : (<>
            <TextField label="Name" value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} fullWidth required size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Code" value={tenantForm.code} onChange={(e) => setTenantForm({ ...tenantForm, code: e.target.value })} fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Domain" value={tenantForm.domain} onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })} fullWidth size="small" /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField select label="Plan" value={tenantForm.plan} onChange={(e) => setTenantForm({ ...tenantForm, plan: e.target.value })} fullWidth size="small">{(options.plans || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select label="Status" value={tenantForm.status} onChange={(e) => setTenantForm({ ...tenantForm, status: e.target.value })} fullWidth size="small"><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="suspended">Suspended</MenuItem></TextField></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Max Users" type="number" value={tenantForm.max_users} onChange={(e) => setTenantForm({ ...tenantForm, max_users: parseInt(e.target.value) || 50 })} fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Currency" value={tenantForm.currency} onChange={(e) => setTenantForm({ ...tenantForm, currency: e.target.value })} fullWidth size="small" /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Contact Name" value={tenantForm.contact_name} onChange={(e) => setTenantForm({ ...tenantForm, contact_name: e.target.value })} fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Contact Email" value={tenantForm.contact_email} onChange={(e) => setTenantForm({ ...tenantForm, contact_email: e.target.value })} fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Notes" value={tenantForm.notes} onChange={(e) => setTenantForm({ ...tenantForm, notes: e.target.value })} fullWidth multiline rows={2} size="small" />
          </>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#7C3AED' }}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
