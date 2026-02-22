import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Tabs, Tab, LinearProgress, Alert, Snackbar, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
  Description as DocIcon, Edit as EditIcon, History as VersionIcon
} from '@mui/icons-material';
import { documentManagementService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const emptyDoc = { name: '', description: '', document_type: 'general', category: 'other', file_name: '', file_url: '', file_size: 0, mime_type: '', status: 'active', entity_type: '', entity_id: '', entity_name: '', notes: '' };

export default function DocumentManagement() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [documents, setDocuments] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyDoc);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [versionDialog, setVersionDialog] = useState({ open: false, docId: null, versions: [] });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, docRes, optRes] = await Promise.all([
        documentManagementService.getSummary(),
        documentManagementService.getDocuments(),
        documentManagementService.getOptions()
      ]);
      if (sumRes.success) setSummary(sumRes.data || {});
      if (docRes.success) setDocuments(docRes.data || []);
      if (optRes.success) setOptions(optRes.data || {});
    } catch (e) { setSnack({ open: true, message: 'Failed to load data', severity: 'error' }); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name || '', description: item.description || '', document_type: item.document_type || 'general', category: item.category || 'other', file_name: item.file_name || '', file_url: item.file_url || '', file_size: item.file_size || 0, mime_type: item.mime_type || '', status: item.status || 'active', entity_type: item.entity_type || '', entity_id: item.entity_id || '', entity_name: item.entity_name || '', notes: item.notes || '' } : emptyDoc);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await documentManagementService.updateDocument(editItem.id, form);
      } else {
        await documentManagementService.createDocument(form);
      }
      setDialogOpen(false);
      setSnack({ open: true, message: editItem ? 'Document updated' : 'Document created', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await documentManagementService.deleteDocument(id);
      setSnack({ open: true, message: 'Document deleted', severity: 'success' });
      loadData();
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const handleViewVersions = async (docId) => {
    try {
      const res = await documentManagementService.getVersions(docId);
      setVersionDialog({ open: true, docId, versions: res.data || [] });
    } catch (e) { setSnack({ open: true, message: e.message, severity: 'error' }); }
  };

  const typeColor = (t) => {
    const map = { contract: '#7C3AED', invoice: '#2563EB', proof_of_performance: '#059669', claim_support: '#D97706', agreement: '#DC2626', report: '#6366F1', general: '#6B7280' };
    return map[t] || '#6B7280';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Document Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage documents, contracts, and supporting files</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={loadData} variant="outlined" size="small">Refresh</Button>
          <Button startIcon={<AddIcon />} onClick={() => openDialog()} variant="contained" size="small" sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>New Document</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Documents" value={summary.total} /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Active" value={summary.active} color="#059669" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Pending Approval" value={summary.pending} color="#D97706" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Size (KB)" value={summary.total_size ? Math.round(summary.total_size / 1024) : 0} color="#2563EB" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tab label="All Documents" />
          <Tab label="Contracts" />
          <Tab label="Claim Support" />
        </Tabs>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Linked To</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tab === 0 ? documents : tab === 1 ? documents.filter(d => d.document_type === 'contract') : documents.filter(d => d.document_type === 'claim_support')).map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DocIcon sx={{ fontSize: 18, color: typeColor(d.document_type) }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={d.document_type} size="small" sx={{ bgcolor: typeColor(d.document_type) + '20', color: typeColor(d.document_type), fontWeight: 600 }} /></TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell><Chip label={d.status} size="small" color={d.status === 'active' ? 'success' : d.status === 'pending_approval' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>v{d.version || 1}</TableCell>
                  <TableCell>{d.entity_type ? `${d.entity_type}: ${d.entity_name || d.entity_id}` : '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Versions"><IconButton size="small" onClick={() => handleViewVersions(d.id)}><VersionIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(d)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(d.id)}><DeleteIcon fontSize="small" color="error" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {documents.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No documents found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Document' : 'New Document'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required size="small" />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} size="small" />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField select label="Type" value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} fullWidth size="small">
                {(options.documentTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth size="small">
                {(options.categories || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          <TextField label="File Name" value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} fullWidth size="small" />
          <TextField label="File URL" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} fullWidth size="small" />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Entity Type" value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Entity Name" value={form.entity_name} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} fullWidth size="small" />
            </Grid>
          </Grid>
          <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth size="small">
            {(options.statuses || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#7C3AED' }}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={versionDialog.open} onClose={() => setVersionDialog({ open: false, docId: null, versions: [] })} maxWidth="sm" fullWidth>
        <DialogTitle>Document Versions</DialogTitle>
        <DialogContent>
          {versionDialog.versions.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>No version history</Typography>
          ) : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Version</TableCell><TableCell>File</TableCell><TableCell>Change</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {versionDialog.versions.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>v{v.version_number}</TableCell>
                    <TableCell>{v.file_name}</TableCell>
                    <TableCell>{v.change_summary || '-'}</TableCell>
                    <TableCell>{v.created_at ? new Date(v.created_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setVersionDialog({ open: false, docId: null, versions: [] })}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
