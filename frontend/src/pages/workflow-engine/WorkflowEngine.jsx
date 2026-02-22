import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Tabs, Tab, LinearProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  AccountTree as WfIcon, Edit as EditIcon,
  Check as ApproveIcon, Close as RejectIcon
} from '@mui/icons-material';
import { workflowEngineService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const emptyTemplate = { name: '', description: '', workflow_type: 'approval', entity_type: '', trigger_event: 'on_submit', sla_hours: '', auto_approve_below: '', notes: '' };

export default function WorkflowEngine() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyTemplate);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [detailDialog, setDetailDialog] = useState({ open: false, instance: null, steps: [] });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, tmpRes, instRes, optRes] = await Promise.all([
        workflowEngineService.getSummary(),
        workflowEngineService.getTemplates(),
        workflowEngineService.getInstances(),
        workflowEngineService.getOptions()
      ]);
      if (sumRes.success) setSummary(sumRes.data || {});
      if (tmpRes.success) setTemplates(tmpRes.data || []);
      if (instRes.success) setInstances(instRes.data || []);
      if (optRes.success) setOptions(optRes.data || {});
    } catch (e) { setSnack({ open: true, message: 'Failed to load data', severity: 'error' }); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name || '', description: item.description || '', workflow_type: item.workflow_type || 'approval', entity_type: item.entity_type || '', trigger_event: item.trigger_event || 'on_submit', sla_hours: item.sla_hours || '', auto_approve_below: item.auto_approve_below || '', notes: item.notes || '' } : emptyTemplate);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, sla_hours: form.sla_hours ? parseInt(form.sla_hours) : null, auto_approve_below: form.auto_approve_below ? parseFloat(form.auto_approve_below) : null };
      if (editItem) { await workflowEngineService.updateTemplate(editItem.id, payload); }
      else { await workflowEngineService.createTemplate(payload); }
      setDialogOpen(false);
      setSnack({ open: true, message: editItem ? 'Updated' : 'Created', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try { await workflowEngineService.deleteTemplate(id); setSnack({ open: true, message: 'Deleted', severity: 'success' }); loadData(); } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleViewInstance = async (id) => {
    try {
      const res = await workflowEngineService.getInstance(id);
      if (res.success) setDetailDialog({ open: true, instance: res.data, steps: res.data.steps || [] });
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleCompleteStep = async (stepId) => {
    try {
      await workflowEngineService.completeStep(stepId, { action: 'approved' });
      setSnack({ open: true, message: 'Step approved', severity: 'success' });
      if (detailDialog.instance) handleViewInstance(detailDialog.instance.id);
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleRejectStep = async (stepId) => {
    try {
      await workflowEngineService.rejectStep(stepId, { comments: 'Rejected' });
      setSnack({ open: true, message: 'Step rejected', severity: 'success' });
      setDetailDialog({ open: false, instance: null, steps: [] });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const statusColor = (s) => ({ in_progress: 'info', completed: 'success', rejected: 'error', pending: 'default' })[s] || 'default';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Workflow Engine</Typography>
          <Typography variant="body2" color="text.secondary">Manage workflow templates, instances, and approvals</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined" size="small">Refresh</Button>
          <Button startIcon={<AddIcon />} onClick={() => openDialog()} variant="contained" size="small" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>New Template</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Templates" value={summary.templates?.total} /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Active Templates" value={summary.templates?.active} color="#059669" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="In Progress" value={summary.instances?.in_progress} color="#2563EB" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Completed" value={summary.instances?.completed} color="#D97706" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tab label="Templates" />
          <Tab label="Instances" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trigger</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SLA</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WfIcon sx={{ fontSize: 18, color: '#7C3AED' }} /><Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography></Box></TableCell>
                    <TableCell><Chip label={t.workflow_type} size="small" /></TableCell>
                    <TableCell>{t.entity_type || '-'}</TableCell>
                    <TableCell>{t.trigger_event}</TableCell>
                    <TableCell>{t.sla_hours ? `${t.sla_hours}h` : '-'}</TableCell>
                    <TableCell><Chip label={t.status} size="small" color={t.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(t)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      {!t.is_system && <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteTemplate(t.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>}
                    </TableCell>
                  </TableRow>
                ))}
                {templates.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No templates found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Workflow</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Step</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Outcome</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Started</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {instances.map((inst) => (
                  <TableRow key={inst.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.template_name}</Typography></TableCell>
                    <TableCell>{inst.entity_name || inst.entity_type || '-'}</TableCell>
                    <TableCell>{inst.current_step}/{inst.total_steps}</TableCell>
                    <TableCell><Chip label={inst.status} size="small" color={statusColor(inst.status)} /></TableCell>
                    <TableCell>{inst.outcome || '-'}</TableCell>
                    <TableCell>{inst.initiated_at ? new Date(inst.initiated_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details"><IconButton size="small" onClick={() => handleViewInstance(inst.id)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {instances.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No workflow instances found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Template' : 'New Template'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required size="small" />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} size="small" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField select label="Workflow Type" value={form.workflow_type} onChange={(e) => setForm({ ...form, workflow_type: e.target.value })} fullWidth size="small">{(options.workflowTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField select label="Entity Type" value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} fullWidth size="small"><MenuItem value="">None</MenuItem>{(options.entityTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={4}><TextField select label="Trigger" value={form.trigger_event} onChange={(e) => setForm({ ...form, trigger_event: e.target.value })} fullWidth size="small">{(options.triggerEvents || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
            <Grid item xs={4}><TextField label="SLA (hours)" type="number" value={form.sla_hours} onChange={(e) => setForm({ ...form, sla_hours: e.target.value })} fullWidth size="small" /></Grid>
            <Grid item xs={4}><TextField label="Auto-approve below (R)" type="number" value={form.auto_approve_below} onChange={(e) => setForm({ ...form, auto_approve_below: e.target.value })} fullWidth size="small" /></Grid>
          </Grid>
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#7C3AED' }}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, instance: null, steps: [] })} maxWidth="md" fullWidth>
        <DialogTitle>Workflow Instance — {detailDialog.instance?.template_name}</DialogTitle>
        <DialogContent>
          {detailDialog.instance && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Entity: {detailDialog.instance.entity_name || '-'} | Status: {detailDialog.instance.status} | Step {detailDialog.instance.current_step}/{detailDialog.instance.total_steps}</Typography>
            </Box>
          )}
          <Table size="small">
            <TableHead><TableRow><TableCell>#</TableCell><TableCell>Step</TableCell><TableCell>Type</TableCell><TableCell>Assignee</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {detailDialog.steps.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.step_number}</TableCell>
                  <TableCell>{s.step_name}</TableCell>
                  <TableCell>{s.step_type}</TableCell>
                  <TableCell>{s.assignee_name || s.assignee_id || '-'}</TableCell>
                  <TableCell><Chip label={s.status} size="small" color={statusColor(s.status)} /></TableCell>
                  <TableCell>
                    {s.status === 'in_progress' && (<>
                      <Tooltip title="Approve"><IconButton size="small" onClick={() => handleCompleteStep(s.id)} color="success"><ApproveIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Reject"><IconButton size="small" onClick={() => handleRejectStep(s.id)} color="error"><RejectIcon fontSize="small" /></IconButton></Tooltip>
                    </>)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog({ open: false, instance: null, steps: [] })}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
