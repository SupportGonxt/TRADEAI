import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Card, CardContent,
  Paper, Chip, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tooltip, Divider, Tabs, Tab
} from '@mui/material';
import {
  Add, Refresh, Delete, Edit, Handshake,
  AccountBalance, TrendingDown, Payment, CheckCircle,
  Cancel, PlayArrow
} from '@mui/icons-material';
import { settlementService, customerService, promotionService, accrualService } from '../../services/api';

const STATUS_COLORS = {
  draft: 'default',
  pending_approval: 'warning',
  approved: 'success',
  processing: 'info',
  partially_paid: 'warning',
  paid: 'primary',
  rejected: 'error',
  disputed: 'error',
  cancelled: 'default'
};

const SettlementManagement = () => {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [accruals, setAccruals] = useState([]);
  const [options, setOptions] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', settlementType: 'claim',
    customerId: '', promotionId: '', accrualId: '',
    claimId: '', deductionId: '',
    glAccount: '', costCenter: '',
    settlementDate: '', dueDate: '',
    accruedAmount: 0, claimedAmount: 0, approvedAmount: 0,
    paymentMethod: 'credit_note', currency: 'ZAR', notes: ''
  });

  const [payForm, setPayForm] = useState({
    amount: 0, paymentType: 'credit_note', paymentDate: '',
    reference: '', bankReference: '', notes: ''
  });

  const [rejectReason, setRejectReason] = useState('');

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.settlement_type = typeFilter;
      const response = await settlementService.getAll(params);
      setSettlements(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load settlements:', error);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await settlementService.getSummary();
      setSummary(response.data || null);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [custRes, promoRes, accRes, optRes] = await Promise.all([
        customerService.getAll({ limit: 200 }),
        promotionService.getAll({ limit: 200 }),
        accrualService.getAll({ limit: 200 }),
        settlementService.getOptions()
      ]);
      setCustomers(custRes.data || []);
      setPromotions(promoRes.data || []);
      setAccruals(accRes.data || []);
      setOptions(optRes.data || null);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }, []);

  useEffect(() => { loadSettlements(); }, [loadSettlements]);
  useEffect(() => { loadSummary(); loadReferenceData(); }, [loadSummary, loadReferenceData]);

  const resetForm = () => {
    setForm({
      name: '', description: '', settlementType: 'claim',
      customerId: '', promotionId: '', accrualId: '',
      claimId: '', deductionId: '',
      glAccount: '', costCenter: '',
      settlementDate: '', dueDate: '',
      accruedAmount: 0, claimedAmount: 0, approvedAmount: 0,
      paymentMethod: 'credit_note', currency: 'ZAR', notes: ''
    });
  };

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      await settlementService.create(form);
      setCreateOpen(false);
      resetForm();
      await loadSettlements();
      await loadSummary();
    } catch (error) {
      console.error('Failed to create settlement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSettlement) return;
    setActionLoading(true);
    try {
      await settlementService.update(selectedSettlement.id, form);
      setEditOpen(false);
      resetForm();
      await loadSettlements();
    } catch (error) {
      console.error('Failed to update settlement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this settlement and all its lines/payments?')) return;
    try {
      await settlementService.delete(id);
      await loadSettlements();
      await loadSummary();
    } catch (error) {
      console.error('Failed to delete settlement:', error);
      alert(error?.response?.data?.message || 'Cannot delete this settlement');
    }
  };

  const handleProcess = async (id) => {
    setActionLoading(true);
    try {
      const result = await settlementService.process(id);
      if (result.success) {
        await loadSettlements();
        await loadSummary();
        if (selectedSettlement && selectedSettlement.id === id) {
          const detail = await settlementService.getById(id);
          setSelectedSettlement(detail.data);
        }
        if (result.message) alert(result.message);
      }
    } catch (error) {
      console.error('Failed to process settlement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this settlement?')) return;
    setActionLoading(true);
    try {
      await settlementService.approve(id);
      await loadSettlements();
      await loadSummary();
      if (selectedSettlement && selectedSettlement.id === id) {
        const detail = await settlementService.getById(id);
        setSelectedSettlement(detail.data);
      }
    } catch (error) {
      console.error('Failed to approve settlement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSettlement) return;
    setActionLoading(true);
    try {
      await settlementService.reject(selectedSettlement.id, { reason: rejectReason });
      setRejectOpen(false);
      setRejectReason('');
      await loadSettlements();
      await loadSummary();
    } catch (error) {
      console.error('Failed to reject settlement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedSettlement) return;
    setActionLoading(true);
    try {
      const result = await settlementService.pay(selectedSettlement.id, payForm);
      if (result.success) {
        setPayOpen(false);
        setPayForm({ amount: 0, paymentType: 'credit_note', paymentDate: '', reference: '', bankReference: '', notes: '' });
        await loadSettlements();
        await loadSummary();
        if (result.message) alert(result.message);
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert(error?.response?.data?.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (settlement) => {
    try {
      const detail = await settlementService.getById(settlement.id);
      setSelectedSettlement(detail.data);
      setDetailTab(0);
      setDetailOpen(true);
    } catch (error) {
      console.error('Failed to load settlement detail:', error);
    }
  };

  const handleOpenEdit = (settlement) => {
    setSelectedSettlement(settlement);
    setForm({
      name: settlement.name || '',
      description: settlement.description || '',
      settlementType: settlement.settlementType || settlement.settlement_type || 'claim',
      customerId: settlement.customerId || settlement.customer_id || '',
      promotionId: settlement.promotionId || settlement.promotion_id || '',
      accrualId: settlement.accrualId || settlement.accrual_id || '',
      claimId: settlement.claimId || settlement.claim_id || '',
      deductionId: settlement.deductionId || settlement.deduction_id || '',
      glAccount: settlement.glAccount || settlement.gl_account || '',
      costCenter: settlement.costCenter || settlement.cost_center || '',
      settlementDate: settlement.settlementDate || settlement.settlement_date || '',
      dueDate: settlement.dueDate || settlement.due_date || '',
      accruedAmount: settlement.accruedAmount || settlement.accrued_amount || 0,
      claimedAmount: settlement.claimedAmount || settlement.claimed_amount || 0,
      approvedAmount: settlement.approvedAmount || settlement.approved_amount || 0,
      paymentMethod: settlement.paymentMethod || settlement.payment_method || 'credit_note',
      currency: settlement.currency || 'ZAR',
      notes: settlement.notes || ''
    });
    setEditOpen(true);
  };

  const handleOpenPay = (settlement) => {
    setSelectedSettlement(settlement);
    const remaining = (settlement.approvedAmount || settlement.approved_amount || 0) - (settlement.settledAmount || settlement.settled_amount || 0);
    setPayForm({
      amount: remaining > 0 ? remaining : 0,
      paymentType: settlement.paymentMethod || settlement.payment_method || 'credit_note',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '', bankReference: '', notes: ''
    });
    setPayOpen(true);
  };

  const fmtR = (val) => {
    if (val === null || val === undefined) return '-';
    return `R${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderSummaryCards = () => {
    if (!summary) return null;
    const s = summary.settlements || {};
    const p = summary.payments || {};
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Handshake sx={{ mr: 1, color: '#7C3AED' }} />
                <Typography variant="body2" color="text.secondary">Settlements</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{s.total || 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {s.approved || 0} approved, {s.paid || 0} paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ mr: 1, color: '#059669' }} />
                <Typography variant="body2" color="text.secondary">Approved</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmtR(s.totalApproved)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Claimed: {fmtR(s.totalClaimed)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Payment sx={{ mr: 1, color: '#2563EB' }} />
                <Typography variant="body2" color="text.secondary">Settled</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmtR(s.totalSettled)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Payments: {fmtR(p.totalPaid)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ mr: 1, color: '#DC2626' }} />
                <Typography variant="body2" color="text.secondary">Variance</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmtR(s.totalVariance)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Pending: {s.pendingApproval || 0} | Rejected: {s.rejected || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFormFields = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField fullWidth label="Settlement Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Description" multiline rows={2} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Settlement Type" value={form.settlementType}
          onChange={(e) => setForm({ ...form, settlementType: e.target.value })}>
          {(options?.settlementTypes || [
            { value: 'claim', label: 'Claim Settlement' },
            { value: 'deduction', label: 'Deduction Settlement' },
            { value: 'rebate', label: 'Rebate Settlement' },
            { value: 'accrual', label: 'Accrual Settlement' },
            { value: 'credit_note', label: 'Credit Note' },
            { value: 'offset', label: 'Offset/Netting' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Payment Method" value={form.paymentMethod}
          onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
          {(options?.paymentMethods || [
            { value: 'credit_note', label: 'Credit Note' },
            { value: 'eft', label: 'EFT / Bank Transfer' },
            { value: 'cheque', label: 'Cheque' },
            { value: 'offset', label: 'Offset Against Invoice' },
            { value: 'debit_note', label: 'Debit Note' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Customer" value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          <MenuItem value="">Select Customer</MenuItem>
          {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Promotion" value={form.promotionId}
          onChange={(e) => setForm({ ...form, promotionId: e.target.value })}>
          <MenuItem value="">None</MenuItem>
          {promotions.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Linked Accrual" value={form.accrualId}
          onChange={(e) => setForm({ ...form, accrualId: e.target.value })}>
          <MenuItem value="">None</MenuItem>
          {accruals.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Currency" value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Settlement Date" type="date" value={form.settlementDate}
          onChange={(e) => setForm({ ...form, settlementDate: e.target.value })}
          InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Due Date" type="date" value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" sx={{ mb: 1 }}>Financial Amounts</Typography></Grid>
      <Grid item xs={4}>
        <TextField fullWidth label="Accrued Amount" type="number" value={form.accruedAmount}
          onChange={(e) => setForm({ ...form, accruedAmount: parseFloat(e.target.value) || 0 })} />
      </Grid>
      <Grid item xs={4}>
        <TextField fullWidth label="Claimed Amount" type="number" value={form.claimedAmount}
          onChange={(e) => setForm({ ...form, claimedAmount: parseFloat(e.target.value) || 0 })} />
      </Grid>
      <Grid item xs={4}>
        <TextField fullWidth label="Approved Amount" type="number" value={form.approvedAmount}
          onChange={(e) => setForm({ ...form, approvedAmount: parseFloat(e.target.value) || 0 })} />
      </Grid>
      <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" sx={{ mb: 1 }}>GL Configuration</Typography></Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="GL Account" value={form.glAccount}
          onChange={(e) => setForm({ ...form, glAccount: e.target.value })}
          placeholder="e.g. Trade Settlement Expense" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Cost Center" value={form.costCenter}
          onChange={(e) => setForm({ ...form, costCenter: e.target.value })}
          placeholder="e.g. Trade Accrual Liability" />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Notes" multiline rows={2} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Grid>
    </Grid>
  );

  const renderSettlementTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F9FAFB' }}>
            <TableCell sx={{ fontWeight: 600 }}>Settlement</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Accrued</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Claimed</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Approved</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Settled</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Variance</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {settlements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No settlements found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : settlements.map((s) => {
            const variance = s.varianceAmount || s.variance_amount || 0;
            return (
              <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(s)}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.settlementNumber || s.settlement_number || ''} | {s.settlementDate || s.settlement_date || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={(s.settlementType || s.settlement_type || '').replace(/_/g, ' ')} />
                </TableCell>
                <TableCell>
                  <Chip size="small" color={STATUS_COLORS[s.status] || 'default'} label={(s.status || '').replace(/_/g, ' ')} />
                </TableCell>
                <TableCell align="right">{fmtR(s.accruedAmount || s.accrued_amount)}</TableCell>
                <TableCell align="right">{fmtR(s.claimedAmount || s.claimed_amount)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtR(s.approvedAmount || s.approved_amount)}</TableCell>
                <TableCell align="right" sx={{ color: '#059669' }}>{fmtR(s.settledAmount || s.settled_amount)}</TableCell>
                <TableCell align="right" sx={{ color: variance > 0 ? '#DC2626' : variance < 0 ? '#059669' : 'inherit' }}>
                  {fmtR(variance)}
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Process">
                    <IconButton size="small" onClick={() => handleProcess(s.id)} color="primary">
                      <PlayArrow fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Approve">
                    <IconButton size="small" onClick={() => handleApprove(s.id)} sx={{ color: '#059669' }}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {(s.status === 'approved' || s.status === 'partially_paid') && (
                    <Tooltip title="Record Payment">
                      <IconButton size="small" onClick={() => handleOpenPay(s)} sx={{ color: '#2563EB' }}>
                        <Payment fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenEdit(s)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(s.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDetailDialog = () => {
    if (!selectedSettlement) return null;
    const s = selectedSettlement;
    const lines = s.lines || [];
    const payments = s.payments || [];

    return (
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{s.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {s.settlementNumber || s.settlement_number} | {(s.settlementType || s.settlement_type || '').replace(/_/g, ' ')} | {fmtR(s.approvedAmount || s.approved_amount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip size="small" color={STATUS_COLORS[s.status] || 'default'} label={(s.status || '').replace(/_/g, ' ')} />
            {s.status === 'draft' && (
              <Button size="small" startIcon={<PlayArrow />} variant="outlined"
                onClick={() => handleProcess(s.id)} disabled={actionLoading}>
                Process
              </Button>
            )}
            {s.status === 'pending_approval' && (
              <>
                <Button size="small" startIcon={<CheckCircle />} variant="contained" color="success"
                  onClick={() => handleApprove(s.id)} disabled={actionLoading}>
                  Approve
                </Button>
                <Button size="small" startIcon={<Cancel />} variant="outlined" color="error"
                  onClick={() => { setDetailOpen(false); setRejectOpen(true); }}>
                  Reject
                </Button>
              </>
            )}
            {(s.status === 'approved' || s.status === 'partially_paid') && (
              <Button size="small" startIcon={<Payment />} variant="contained"
                onClick={() => { setDetailOpen(false); handleOpenPay(s); }}
                sx={{ bgcolor: '#2563EB' }}>
                Record Payment
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label={`Line Items (${lines.length})`} />
            <Tab label={`Payments (${payments.length})`} />
          </Tabs>

          {detailTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Accrued</Typography>
                <Typography variant="h6">{fmtR(s.accruedAmount || s.accrued_amount)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Claimed</Typography>
                <Typography variant="h6">{fmtR(s.claimedAmount || s.claimed_amount)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Approved</Typography>
                <Typography variant="h6" sx={{ color: '#059669' }}>{fmtR(s.approvedAmount || s.approved_amount)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Settled</Typography>
                <Typography variant="h6" sx={{ color: '#2563EB' }}>{fmtR(s.settledAmount || s.settled_amount)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Variance</Typography>
                <Typography variant="h6" sx={{ color: (s.varianceAmount || s.variance_amount || 0) > 0 ? '#DC2626' : '#059669' }}>
                  {fmtR(s.varianceAmount || s.variance_amount)} ({(s.variancePct || s.variance_pct || 0).toFixed(1)}%)
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{(s.paymentMethod || s.payment_method || '').replace(/_/g, ' ')}</Typography>
              </Grid>
              <Grid item xs={12}><Divider /></Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Settlement Date</Typography>
                <Typography variant="body2">{s.settlementDate || s.settlement_date || '-'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Due Date</Typography>
                <Typography variant="body2">{s.dueDate || s.due_date || '-'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Currency</Typography>
                <Typography variant="body2">{s.currency}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">GL Account</Typography>
                <Typography variant="body2">{s.glAccount || s.gl_account || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Cost Center</Typography>
                <Typography variant="body2">{s.costCenter || s.cost_center || 'Not set'}</Typography>
              </Grid>
              {s.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{s.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}

          {detailTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Claimed</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Approved</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Adjustment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Settled</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No line items. Add lines when creating the settlement.
                      </TableCell>
                    </TableRow>
                  ) : lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.lineNumber || l.line_number}</TableCell>
                      <TableCell>{l.productName || l.product_name || '-'}</TableCell>
                      <TableCell>{l.category || '-'}</TableCell>
                      <TableCell align="right">{l.quantity || 0}</TableCell>
                      <TableCell align="right">{fmtR(l.claimedAmount || l.claimed_amount)}</TableCell>
                      <TableCell align="right">{fmtR(l.approvedAmount || l.approved_amount)}</TableCell>
                      <TableCell align="right" sx={{ color: (l.adjustmentAmount || l.adjustment_amount || 0) !== 0 ? '#DC2626' : 'inherit' }}>
                        {fmtR(l.adjustmentAmount || l.adjustment_amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtR(l.settledAmount || l.settled_amount)}</TableCell>
                      <TableCell>
                        <Chip size="small" color={l.status === 'processed' ? 'success' : 'default'} label={l.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {detailTab === 2 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Bank Ref</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{(p.paymentDate || p.payment_date || '').split('T')[0]}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{(p.paymentType || p.payment_type || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{p.reference || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#059669' }}>{fmtR(p.amount)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{p.bankReference || p.bank_reference || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" color={p.status === 'completed' ? 'success' : 'warning'} label={p.status} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Settlement Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Reconcile accruals against claims, process approvals, and record payments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => { loadSettlements(); loadSummary(); }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setCreateOpen(true); }}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            New Settlement
          </Button>
        </Box>
      </Box>

      {renderSummaryCards()}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="pending_approval">Pending Approval</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
        <TextField select size="small" label="Type" value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="claim">Claim</MenuItem>
          <MenuItem value="deduction">Deduction</MenuItem>
          <MenuItem value="rebate">Rebate</MenuItem>
          <MenuItem value="accrual">Accrual</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
          {total} settlement{total !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderSettlementTable()
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Settlement</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={actionLoading || !form.name}
            sx={{ bgcolor: '#7C3AED' }}>
            {actionLoading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Settlement</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={actionLoading || !form.name}
            sx={{ bgcolor: '#7C3AED' }}>
            {actionLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Recording payment for: {selectedSettlement?.name}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Amount" type="number" value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Payment Type" value={payForm.paymentType}
                onChange={(e) => setPayForm({ ...payForm, paymentType: e.target.value })}>
                <MenuItem value="credit_note">Credit Note</MenuItem>
                <MenuItem value="eft">EFT / Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
                <MenuItem value="offset">Offset</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Payment Date" type="date" value={payForm.paymentDate}
                onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Reference" value={payForm.reference}
                onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Bank Reference" value={payForm.bankReference}
                onChange={(e) => setPayForm({ ...payForm, bankReference: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePay} disabled={actionLoading || payForm.amount <= 0}
            sx={{ bgcolor: '#2563EB' }}>
            {actionLoading ? <CircularProgress size={20} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Settlement</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Rejecting: {selectedSettlement?.name}
          </Typography>
          <TextField fullWidth label="Reason for Rejection" multiline rows={3} required
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}
            disabled={actionLoading || !rejectReason}>
            {actionLoading ? <CircularProgress size={20} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {renderDetailDialog()}
    </Box>
  );
};

export default SettlementManagement;
