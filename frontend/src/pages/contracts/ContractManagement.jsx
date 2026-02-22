import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, TextField, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Tabs, Tab, Card, CardContent, LinearProgress, Alert, Snackbar,
  TablePagination, InputAdornment, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, ArrowBack as BackIcon, Refresh as RefreshIcon,
  Description as ContractIcon, Gavel as TermIcon,
  Flag as MilestoneIcon, ChangeHistory as AmendmentIcon,
  CheckCircle as ActiveIcon, Warning as ExpiringIcon
} from '@mui/icons-material';
import { contractManagementService } from '../../services/api';

const statusColors = {
  draft: 'default', active: 'success', expired: 'error', terminated: 'error',
  pending: 'warning', under_review: 'info', suspended: 'warning',
  completed: 'success', overdue: 'error', approved: 'success', rejected: 'error'
};

const ContractManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('contract');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const loadSummary = useCallback(async () => {
    try {
      const res = await contractManagementService.getSummary();
      if (res.success) setSummary(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const res = await contractManagementService.getOptions();
      if (res.success) setOptions(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await contractManagementService.getContracts(params);
      if (res.success) { setContracts(res.data || []); setTotal(res.total || 0); }
    } catch (e) { showSnack('Failed to load contracts', 'error'); }
    setLoading(false);
  }, [page, rowsPerPage, search, statusFilter]);

  const loadDetail = useCallback(async (contractId) => {
    setLoading(true);
    try {
      const res = await contractManagementService.getContractById(contractId);
      if (res.success) setDetail(res.data);
    } catch (e) { showSnack('Failed to load contract details', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => { if (!id) loadContracts(); }, [id, loadContracts]);
  useEffect(() => { if (id) loadDetail(id); }, [id, loadDetail]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setForm(type === 'contract' ? { name: '', contractType: 'trade_agreement', status: 'draft', priority: 'medium' } :
      type === 'term' ? { name: '', termType: 'volume_rebate', rate: 0, rateType: 'percentage', contractId: id } :
      type === 'milestone' ? { name: '', milestoneType: 'review', priority: 'medium', contractId: id } :
      { name: '', amendmentType: 'modification', contractId: id });
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setDialogType('contract');
    setEditItem(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'contract') {
        if (editItem) {
          await contractManagementService.updateContract(editItem.id, form);
          showSnack('Contract updated');
        } else {
          await contractManagementService.createContract(form);
          showSnack('Contract created');
        }
        loadContracts();
        if (id) loadDetail(id);
      } else if (dialogType === 'term') {
        await contractManagementService.createTerm(form);
        showSnack('Term added');
        if (id) loadDetail(id);
      } else if (dialogType === 'milestone') {
        await contractManagementService.createMilestone(form);
        showSnack('Milestone added');
        if (id) loadDetail(id);
      } else if (dialogType === 'amendment') {
        await contractManagementService.createAmendment(form);
        showSnack('Amendment added');
        if (id) loadDetail(id);
      }
      loadSummary();
      setDialogOpen(false);
    } catch (e) { showSnack('Save failed: ' + (e.response?.data?.message || e.message), 'error'); }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'contract') { await contractManagementService.deleteContract(itemId); showSnack('Contract deleted'); loadContracts(); }
      else if (type === 'term') { await contractManagementService.deleteTerm(itemId); showSnack('Term deleted'); }
      else if (type === 'milestone') { await contractManagementService.deleteMilestone(itemId); showSnack('Milestone deleted'); }
      else if (type === 'amendment') { await contractManagementService.deleteAmendment(itemId); showSnack('Amendment deleted'); }
      loadSummary();
      if (id) loadDetail(id);
    } catch (e) { showSnack('Delete failed', 'error'); }
  };

  const formatCurrency = (val) => val ? `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00';

  if (id && detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/contracts')}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{detail.name}</Typography>
            <Typography variant="body2" color="text.secondary">{detail.contractNumber} | {detail.contractType}</Typography>
          </Box>
          <Chip label={detail.status} color={statusColors[detail.status] || 'default'} />
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(detail)}>Edit</Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Total Value</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(detail.totalValue)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Committed Spend</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(detail.committedSpend)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Actual Spend</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(detail.actualSpend)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Period</Typography>
              <Typography variant="h6" fontWeight={700}>{detail.startDate || '—'} to {detail.endDate || '—'}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Customer</Typography><Typography>{detail.customerName || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Vendor</Typography><Typography>{detail.vendorName || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Owner</Typography><Typography>{detail.owner || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Department</Typography><Typography>{detail.department || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Priority</Typography><Chip label={detail.priority || 'medium'} size="small" /></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Risk Level</Typography><Chip label={detail.riskLevel || 'low'} size="small" color={detail.riskLevel === 'high' ? 'error' : detail.riskLevel === 'medium' ? 'warning' : 'success'} /></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Compliance</Typography><Chip label={detail.complianceStatus || 'compliant'} size="small" color={detail.complianceStatus === 'non_compliant' ? 'error' : 'success'} /></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Auto Renew</Typography><Typography>{detail.autoRenew ? 'Yes' : 'No'}</Typography></Grid>
          </Grid>
        </Paper>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Terms (${detail.terms?.length || 0})`} icon={<TermIcon />} iconPosition="start" />
          <Tab label={`Milestones (${detail.milestones?.length || 0})`} icon={<MilestoneIcon />} iconPosition="start" />
          <Tab label={`Amendments (${detail.amendments?.length || 0})`} icon={<AmendmentIcon />} iconPosition="start" />
        </Tabs>

        {tab === 0 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Contract Terms</Typography>
              <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleCreate('term')}>Add Term</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Rate</TableCell>
                  <TableCell>Threshold</TableCell><TableCell>Basis</TableCell><TableCell>Settlement</TableCell>
                  <TableCell>Accrued</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {(detail.terms || []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.termType}</TableCell>
                      <TableCell>{t.rate}{t.rateType === 'percentage' ? '%' : ''}</TableCell>
                      <TableCell>{formatCurrency(t.threshold)}</TableCell>
                      <TableCell>{t.calculationBasis}</TableCell>
                      <TableCell>{t.settlementFrequency}</TableCell>
                      <TableCell>{formatCurrency(t.accruedAmount)}</TableCell>
                      <TableCell><Chip label={t.status} size="small" color={statusColors[t.status] || 'default'} /></TableCell>
                      <TableCell><IconButton size="small" onClick={() => handleDelete('term', t.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {(!detail.terms || detail.terms.length === 0) && <TableRow><TableCell colSpan={9} align="center">No terms</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 1 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Milestones</Typography>
              <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleCreate('milestone')}>Add Milestone</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Due Date</TableCell>
                  <TableCell>Assigned To</TableCell><TableCell>Priority</TableCell><TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {(detail.milestones || []).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.milestoneType}</TableCell>
                      <TableCell>{m.dueDate || '—'}</TableCell>
                      <TableCell>{m.assignedTo || '—'}</TableCell>
                      <TableCell><Chip label={m.priority} size="small" /></TableCell>
                      <TableCell>{formatCurrency(m.amount)}</TableCell>
                      <TableCell><Chip label={m.status} size="small" color={statusColors[m.status] || 'default'} /></TableCell>
                      <TableCell><IconButton size="small" onClick={() => handleDelete('milestone', m.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {(!detail.milestones || detail.milestones.length === 0) && <TableRow><TableCell colSpan={8} align="center">No milestones</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 2 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Amendments</Typography>
              <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => handleCreate('amendment')}>Add Amendment</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Effective Date</TableCell>
                  <TableCell>Field Changed</TableCell><TableCell>Old Value</TableCell><TableCell>New Value</TableCell>
                  <TableCell>Impact</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {(detail.amendments || []).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.amendmentType}</TableCell>
                      <TableCell>{a.effectiveDate || '—'}</TableCell>
                      <TableCell>{a.fieldChanged || '—'}</TableCell>
                      <TableCell>{a.oldValue || '—'}</TableCell>
                      <TableCell>{a.newValue || '—'}</TableCell>
                      <TableCell>{formatCurrency(a.impactAmount)}</TableCell>
                      <TableCell><Chip label={a.status} size="small" color={statusColors[a.status] || 'default'} /></TableCell>
                      <TableCell><IconButton size="small" onClick={() => handleDelete('amendment', a.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {(!detail.amendments || detail.amendments.length === 0) && <TableRow><TableCell colSpan={9} align="center">No amendments</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editItem ? 'Edit' : 'New'} {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
              {dialogType === 'contract' && (
                <>
                  <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
                  <TextField label="Contract Type" select value={form.contractType || 'trade_agreement'} onChange={(e) => setForm({ ...form, contractType: e.target.value })} fullWidth>
                    {(options?.contractTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={6}><TextField label="End Date" type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Total Value" type="number" value={form.totalValue || ''} onChange={(e) => setForm({ ...form, totalValue: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                    <Grid item xs={6}><TextField label="Committed Spend" type="number" value={form.committedSpend || ''} onChange={(e) => setForm({ ...form, committedSpend: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Customer Name" value={form.customerName || ''} onChange={(e) => setForm({ ...form, customerName: e.target.value })} fullWidth /></Grid>
                    <Grid item xs={6}><TextField label="Vendor Name" value={form.vendorName || ''} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} fullWidth /></Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Owner" value={form.owner || ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} fullWidth /></Grid>
                    <Grid item xs={6}><TextField label="Department" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} fullWidth /></Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField label="Priority" select value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })} fullWidth>
                        {(options?.priorities || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Status" select value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
                        <MenuItem value="draft">Draft</MenuItem><MenuItem value="active">Active</MenuItem>
                        <MenuItem value="expired">Expired</MenuItem><MenuItem value="terminated">Terminated</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </>
              )}
              {dialogType === 'term' && (
                <>
                  <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
                  <TextField label="Term Type" select value={form.termType || 'volume_rebate'} onChange={(e) => setForm({ ...form, termType: e.target.value })} fullWidth>
                    {(options?.termTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <Grid container spacing={2}>
                    <Grid item xs={4}><TextField label="Rate" type="number" value={form.rate || ''} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                    <Grid item xs={4}><TextField label="Rate Type" select value={form.rateType || 'percentage'} onChange={(e) => setForm({ ...form, rateType: e.target.value })} fullWidth><MenuItem value="percentage">Percentage</MenuItem><MenuItem value="fixed">Fixed</MenuItem></TextField></Grid>
                    <Grid item xs={4}><TextField label="Threshold" type="number" value={form.threshold || ''} onChange={(e) => setForm({ ...form, threshold: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Calculation Basis" select value={form.calculationBasis || 'net_sales'} onChange={(e) => setForm({ ...form, calculationBasis: e.target.value })} fullWidth><MenuItem value="net_sales">Net Sales</MenuItem><MenuItem value="gross_sales">Gross Sales</MenuItem><MenuItem value="volume">Volume</MenuItem></TextField></Grid>
                    <Grid item xs={6}><TextField label="Settlement Frequency" select value={form.settlementFrequency || 'quarterly'} onChange={(e) => setForm({ ...form, settlementFrequency: e.target.value })} fullWidth><MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="annually">Annually</MenuItem></TextField></Grid>
                  </Grid>
                </>
              )}
              {dialogType === 'milestone' && (
                <>
                  <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
                  <TextField label="Milestone Type" select value={form.milestoneType || 'review'} onChange={(e) => setForm({ ...form, milestoneType: e.target.value })} fullWidth>
                    {(options?.milestoneTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Due Date" type="date" value={form.dueDate || ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={6}><TextField label="Amount" type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  </Grid>
                  <TextField label="Assigned To" value={form.assignedTo || ''} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} fullWidth />
                </>
              )}
              {dialogType === 'amendment' && (
                <>
                  <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
                  <TextField label="Amendment Type" select value={form.amendmentType || 'modification'} onChange={(e) => setForm({ ...form, amendmentType: e.target.value })} fullWidth>
                    <MenuItem value="modification">Modification</MenuItem><MenuItem value="extension">Extension</MenuItem>
                    <MenuItem value="termination">Termination</MenuItem><MenuItem value="renewal">Renewal</MenuItem>
                  </TextField>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Effective Date" type="date" value={form.effectiveDate || ''} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={6}><TextField label="Impact Amount" type="number" value={form.impactAmount || ''} onChange={(e) => setForm({ ...form, impactAmount: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  </Grid>
                  <TextField label="Reason" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} fullWidth multiline rows={2} />
                </>
              )}
              <TextField label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
          <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Contract Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage trade contracts, terms, milestones, and amendments</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => { loadContracts(); loadSummary(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('contract')}>New Contract</Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#F5F3FF', border: '1px solid #E9D5FF' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><ContractIcon sx={{ color: '#7C3AED' }} /><Typography variant="body2" color="text.secondary">Total Contracts</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{summary.contracts?.total || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{summary.contracts?.active || 0} active</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><ActiveIcon sx={{ color: '#059669' }} /><Typography variant="body2" color="text.secondary">Active Value</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{formatCurrency(summary.totalActiveValue)}</Typography>
              <Typography variant="body2" color="text.secondary">across active contracts</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><ExpiringIcon sx={{ color: '#D97706' }} /><Typography variant="body2" color="text.secondary">Expiring Soon</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{summary.contracts?.expiring || 0}</Typography>
              <Typography variant="body2" color="text.secondary">within 30 days</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><MilestoneIcon sx={{ color: '#2563EB' }} /><Typography variant="body2" color="text.secondary">Pending Milestones</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{summary.pendingMilestones || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{summary.terms || 0} total terms</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search contracts..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <TextField
            select size="small" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            sx={{ width: 150 }} label="Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="terminated">Terminated</MenuItem>
          </TextField>
        </Box>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Contract</TableCell><TableCell>Type</TableCell><TableCell>Customer</TableCell>
              <TableCell>Value</TableCell><TableCell>Period</TableCell><TableCell>Priority</TableCell>
              <TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contracts/${c.id}`)}>
                  <TableCell>
                    <Typography fontWeight={600}>{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{c.contractNumber}</Typography>
                  </TableCell>
                  <TableCell><Chip label={c.contractType} size="small" variant="outlined" /></TableCell>
                  <TableCell>{c.customerName || '—'}</TableCell>
                  <TableCell>{formatCurrency(c.totalValue)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.startDate || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">to {c.endDate || '—'}</Typography>
                  </TableCell>
                  <TableCell><Chip label={c.priority || 'medium'} size="small" /></TableCell>
                  <TableCell><Chip label={c.status} size="small" color={statusColors[c.status] || 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('contract', c.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No contracts found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'New'} Contract</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
            <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <TextField label="Contract Type" select value={form.contractType || 'trade_agreement'} onChange={(e) => setForm({ ...form, contractType: e.target.value })} fullWidth>
              {(options?.contractTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Start Date" type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="End Date" type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Total Value" type="number" value={form.totalValue || ''} onChange={(e) => setForm({ ...form, totalValue: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Committed Spend" type="number" value={form.committedSpend || ''} onChange={(e) => setForm({ ...form, committedSpend: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Customer Name" value={form.customerName || ''} onChange={(e) => setForm({ ...form, customerName: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Vendor Name" value={form.vendorName || ''} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} fullWidth /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Owner" value={form.owner || ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField label="Department" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} fullWidth /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Priority" select value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })} fullWidth>
                  {(options?.priorities || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="Status" select value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
                  <MenuItem value="draft">Draft</MenuItem><MenuItem value="active">Active</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem><MenuItem value="terminated">Terminated</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <TextField label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractManagement;
