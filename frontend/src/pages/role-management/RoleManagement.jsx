import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Tabs, Tab, LinearProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Security as RoleIcon, Edit as EditIcon,
  Shield as PermIcon
} from '@mui/icons-material';
import { roleManagementService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const emptyRole = { name: '', description: '', role_type: 'custom', level: 0, max_approval_amount: '', notes: '' };

export default function RoleManagement() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [permGroups, setPermGroups] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyRole);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, roleRes, assignRes, groupRes, optRes] = await Promise.all([
        roleManagementService.getSummary(),
        roleManagementService.getRoles(),
        roleManagementService.getAssignments(),
        roleManagementService.getPermissionGroups(),
        roleManagementService.getOptions()
      ]);
      if (sumRes.success) setSummary(sumRes.data || {});
      if (roleRes.success) setRoles(roleRes.data || []);
      if (assignRes.success) setAssignments(assignRes.data || []);
      if (groupRes.success) setPermGroups(groupRes.data || []);
      if (optRes.success) setOptions(optRes.data || {});
    } catch (e) { setSnack({ open: true, message: 'Failed to load data', severity: 'error' }); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name || '', description: item.description || '', role_type: item.role_type || 'custom', level: item.level || 0, max_approval_amount: item.max_approval_amount || '', notes: item.notes || '' } : emptyRole);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, max_approval_amount: form.max_approval_amount ? parseFloat(form.max_approval_amount) : null };
      if (editItem) { await roleManagementService.updateRole(editItem.id, payload); }
      else { await roleManagementService.createRole(payload); }
      setDialogOpen(false);
      setSnack({ open: true, message: editItem ? 'Role updated' : 'Role created', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await roleManagementService.deleteRole(id);
      setSnack({ open: true, message: 'Role deleted', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Role & Permission Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage roles, permissions, and user assignments</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined" size="small">Refresh</Button>
          <Button startIcon={<AddIcon />} onClick={() => openDialog()} variant="contained" size="small" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>New Role</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Total Roles" value={summary.roles?.total} /></Grid>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Active Roles" value={summary.roles?.active} color="#059669" /></Grid>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Users Assigned" value={summary.assignments?.users} color="#2563EB" /></Grid>
        <Grid item xs={12} sm={6} md={3}><SummaryCard title="Permission Groups" value={summary.permissionGroups?.total} color="#D97706" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tab label="Roles" />
          <Tab label="User Assignments" />
          <Tab label="Permission Groups" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Max Approval</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><RoleIcon sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{r.name}</Typography></Box></TableCell>
                    <TableCell><Chip label={r.role_type} size="small" color={r.role_type === 'system' ? 'primary' : 'default'} /></TableCell>
                    <TableCell>{r.level}</TableCell>
                    <TableCell>{r.max_approval_amount ? `R${Number(r.max_approval_amount).toLocaleString()}` : 'Unlimited'}</TableCell>
                    <TableCell><Chip label={r.is_active ? 'Active' : 'Inactive'} size="small" color={r.is_active ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(r)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      {!r.is_system && <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(r.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>}
                    </TableCell>
                  </TableRow>
                ))}
                {roles.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No roles found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Assigned</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.user_id}</TableCell>
                    <TableCell>{a.role_name || a.role_id}</TableCell>
                    <TableCell><Chip label={a.status} size="small" color={a.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {assignments.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No assignments found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Group Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Permissions</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>System</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {permGroups.map((g) => (
                  <TableRow key={g.id} hover>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PermIcon sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{g.name}</Typography></Box></TableCell>
                    <TableCell>{g.module || '-'}</TableCell>
                    <TableCell>{(() => { try { return JSON.parse(g.permissions || '[]').length; } catch { return 0; } })()}</TableCell>
                    <TableCell>{g.is_system ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
                {permGroups.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No permission groups found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Role' : 'New Role'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required size="small" />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} size="small" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField select label="Type" value={form.role_type} onChange={(e) => setForm({ ...form, role_type: e.target.value })} fullWidth size="small">{(options.roleTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12} sm={6}><TextField label="Level" type="number" value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 0 })} fullWidth size="small" /></Grid>
          </Grid>
          <TextField label="Max Approval Amount (R)" type="number" value={form.max_approval_amount} onChange={(e) => setForm({ ...form, max_approval_amount: e.target.value })} fullWidth size="small" />
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} size="small" />
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
