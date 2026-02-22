import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, LinearProgress, Alert, Snackbar, alpha
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  History as AuditIcon, Policy as PolicyIcon, VpnKey as AccessIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { auditComplianceService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>{title}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color, mt: 0.5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const emptyEvent = { entityType: 'promotion', entityId: '', entityName: '', actionType: 'create', actionLabel: '', severity: 'info', source: 'ui', notes: '' };
const emptyPolicy = { name: '', description: '', policyType: 'control', appliesTo: '', enforcementLevel: 'advisory', status: 'active', version: '1.0', owner: '', effectiveFrom: '', effectiveTo: '', notes: '' };
const emptyAccessLog = { resourceType: 'promotion', resourceId: '', resourceName: '', accessType: 'read', outcome: 'success', reason: '', notes: '' };

export default function AuditCompliance() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [events, setEvents] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, type: '', mode: 'create', data: {} });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, evtRes, polRes, accRes] = await Promise.all([
        auditComplianceService.getSummary().catch(() => ({ data: {} })),
        auditComplianceService.getEvents().catch(() => ({ data: [] })),
        auditComplianceService.getPolicies().catch(() => ({ data: [] })),
        auditComplianceService.getAccessLogs().catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data || {});
      setEvents(evtRes.data || []);
      setPolicies(polRes.data || []);
      setAccessLogs(accRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (type, mode = 'create', data = null) => {
    const defaults = type === 'event' ? emptyEvent : type === 'policy' ? emptyPolicy : emptyAccessLog;
    setDialog({ open: true, type, mode, data: data || { ...defaults } });
  };

  const handleSave = async () => {
    try {
      const { type, mode, data } = dialog;
      if (type === 'event') {
        await auditComplianceService.createEvent(data);
      } else if (type === 'policy') {
        if (mode === 'edit') await auditComplianceService.updatePolicy(data.id, data);
        else await auditComplianceService.createPolicy(data);
      } else {
        await auditComplianceService.createAccessLog(data);
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
      if (type === 'event') await auditComplianceService.deleteEvent(id);
      else if (type === 'policy') await auditComplianceService.deletePolicy(id);
      else await auditComplianceService.deleteAccessLog(id);
      setSnack({ open: true, message: 'Deleted', severity: 'success' });
      loadData();
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Error deleting', severity: 'error' });
    }
  };

  const sevColor = (s) => {
    if (s === 'critical') return '#DC2626';
    if (s === 'high') return '#F59E0B';
    if (s === 'warning') return '#F97316';
    return '#6B7280';
  };

  const outcomeColor = (o) => {
    if (o === 'success') return '#10B981';
    if (o === 'denied') return '#EF4444';
    return '#F59E0B';
  };

  const { data: d } = dialog;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Audit Trail & Compliance</Typography>
          <Typography variant="body2" color="text.secondary">Track changes, enforce policies, monitor data access</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog(tab === 0 ? 'event' : tab === 1 ? 'policy' : 'accessLog')} size="small"
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add {tab === 0 ? 'Event' : tab === 1 ? 'Policy' : 'Access Log'}
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><SummaryCard title="Audit Events" value={summary.totalEvents || 0} /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Compliance Policies" value={summary.totalPolicies || 0} color="#3B82F6" /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Access Logs" value={summary.totalAccessLogs || 0} color="#10B981" /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="High Severity" value={summary.highSeverityEvents || 0} color="#EF4444" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab icon={<AuditIcon />} iconPosition="start" label="Audit Events" />
          <Tab icon={<PolicyIcon />} iconPosition="start" label="Compliance Policies" />
          <Tab icon={<AccessIcon />} iconPosition="start" label="Data Access Logs" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{e.entityName || e.entityId || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{e.entityType}</Typography>
                    </TableCell>
                    <TableCell><Chip label={e.actionType} size="small" /></TableCell>
                    <TableCell><Chip label={e.severity} size="small" sx={{ bgcolor: alpha(sevColor(e.severity), 0.1), color: sevColor(e.severity) }} /></TableCell>
                    <TableCell>{e.actorName || '—'}</TableCell>
                    <TableCell><Chip label={e.source} size="small" variant="outlined" /></TableCell>
                    <TableCell>{e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleDelete('event', e.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No audit events yet</TableCell></TableRow>}
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
                  <TableCell sx={{ fontWeight: 600 }}>Enforcement</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Effective</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.description || ''}</Typography>
                    </TableCell>
                    <TableCell><Chip label={p.policyType} size="small" /></TableCell>
                    <TableCell><Chip label={p.enforcementLevel} size="small" color={p.enforcementLevel === 'enforced' ? 'warning' : p.enforcementLevel === 'blocked' ? 'error' : 'default'} /></TableCell>
                    <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{p.owner || '—'}</TableCell>
                    <TableCell>{p.effectiveFrom || '—'} — {p.effectiveTo || '—'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openDialog('policy', 'edit', p)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete('policy', p.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {policies.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No compliance policies yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Access Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Outcome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessLogs.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{a.resourceName || a.resourceId || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.resourceType}</Typography>
                    </TableCell>
                    <TableCell><Chip label={a.accessType} size="small" /></TableCell>
                    <TableCell><Chip label={a.outcome} size="small" sx={{ bgcolor: alpha(outcomeColor(a.outcome), 0.1), color: outcomeColor(a.outcome) }} /></TableCell>
                    <TableCell>{a.actorName || '—'}</TableCell>
                    <TableCell>{a.reason || '—'}</TableCell>
                    <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleDelete('accessLog', a.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {accessLogs.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No access logs yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'edit' ? 'Edit' : 'New'} {dialog.type === 'accessLog' ? 'Access Log' : dialog.type}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {dialog.type === 'event' && (
            <>
              <TextField label="Entity Type" value={d.entityType || 'promotion'} onChange={(e) => setDialog({ ...dialog, data: { ...d, entityType: e.target.value } })} select fullWidth size="small">
                {['promotion', 'budget', 'trade_spend', 'claim', 'deduction', 'rebate', 'customer', 'product', 'user', 'settings'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Entity Name" value={d.entityName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, entityName: e.target.value } })} fullWidth size="small" />
              <TextField label="Entity ID" value={d.entityId || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, entityId: e.target.value } })} fullWidth size="small" />
              <TextField label="Action Type" value={d.actionType || 'create'} onChange={(e) => setDialog({ ...dialog, data: { ...d, actionType: e.target.value } })} select fullWidth size="small">
                {['create', 'update', 'delete', 'approve', 'reject', 'export', 'import', 'login', 'logout'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Severity" value={d.severity || 'info'} onChange={(e) => setDialog({ ...dialog, data: { ...d, severity: e.target.value } })} select fullWidth size="small">
                {['info', 'warning', 'high', 'critical'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Source" value={d.source || 'ui'} onChange={(e) => setDialog({ ...dialog, data: { ...d, source: e.target.value } })} select fullWidth size="small">
                {['ui', 'api', 'integration', 'system'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Notes" value={d.notes || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, notes: e.target.value } })} fullWidth size="small" multiline rows={2} />
            </>
          )}
          {dialog.type === 'policy' && (
            <>
              <TextField label="Name" value={d.name || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, name: e.target.value } })} fullWidth size="small" />
              <TextField label="Description" value={d.description || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, description: e.target.value } })} fullWidth size="small" multiline rows={2} />
              <TextField label="Policy Type" value={d.policyType || 'control'} onChange={(e) => setDialog({ ...dialog, data: { ...d, policyType: e.target.value } })} select fullWidth size="small">
                {['control', 'segregation_of_duties', 'approval', 'data_retention', 'security', 'privacy'].map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
              <TextField label="Enforcement Level" value={d.enforcementLevel || 'advisory'} onChange={(e) => setDialog({ ...dialog, data: { ...d, enforcementLevel: e.target.value } })} select fullWidth size="small">
                {['advisory', 'enforced', 'blocked'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Status" value={d.status || 'active'} onChange={(e) => setDialog({ ...dialog, data: { ...d, status: e.target.value } })} select fullWidth size="small">
                {['active', 'draft', 'archived'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Version" value={d.version || '1.0'} onChange={(e) => setDialog({ ...dialog, data: { ...d, version: e.target.value } })} fullWidth size="small" />
              <TextField label="Owner" value={d.owner || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, owner: e.target.value } })} fullWidth size="small" />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Effective From" type="date" value={d.effectiveFrom || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, effectiveFrom: e.target.value } })} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField label="Effective To" type="date" value={d.effectiveTo || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, effectiveTo: e.target.value } })} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <TextField label="Notes" value={d.notes || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, notes: e.target.value } })} fullWidth size="small" multiline rows={2} />
            </>
          )}
          {dialog.type === 'accessLog' && (
            <>
              <TextField label="Resource Type" value={d.resourceType || 'promotion'} onChange={(e) => setDialog({ ...dialog, data: { ...d, resourceType: e.target.value } })} select fullWidth size="small">
                {['promotion', 'budget', 'trade_spend', 'claim', 'deduction', 'rebate', 'customer', 'product', 'user', 'report'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Resource Name" value={d.resourceName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, resourceName: e.target.value } })} fullWidth size="small" />
              <TextField label="Resource ID" value={d.resourceId || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, resourceId: e.target.value } })} fullWidth size="small" />
              <TextField label="Access Type" value={d.accessType || 'read'} onChange={(e) => setDialog({ ...dialog, data: { ...d, accessType: e.target.value } })} select fullWidth size="small">
                {['read', 'write', 'delete', 'export', 'import'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Outcome" value={d.outcome || 'success'} onChange={(e) => setDialog({ ...dialog, data: { ...d, outcome: e.target.value } })} select fullWidth size="small">
                {['success', 'denied', 'error'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Reason" value={d.reason || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, reason: e.target.value } })} fullWidth size="small" />
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
