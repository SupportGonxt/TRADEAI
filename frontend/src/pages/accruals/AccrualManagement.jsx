import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Card, CardContent,
  Paper, Chip, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tooltip, Divider, Tabs, Tab
} from '@mui/material';
import {
  Add, Refresh, Calculate, CheckCircle, Delete, Edit,
  AccountBalance, TrendingUp, Receipt, PostAdd,
  Undo, Gavel
} from '@mui/icons-material';
import { accrualService, customerService, productService, promotionService, baselineService } from '../../services/api';

const STATUS_COLORS = {
  draft: 'default',
  active: 'success',
  calculating: 'info',
  posted: 'primary',
  partially_settled: 'warning',
  fully_settled: 'secondary',
  reversed: 'error',
  closed: 'default'
};

const AccrualManagement = () => {
  const [loading, setLoading] = useState(true);
  const [accruals, setAccruals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [selectedAccrual, setSelectedAccrual] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [options, setOptions] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', accrualType: 'promotion',
    calculationMethod: 'percentage_of_sales', frequency: 'monthly',
    customerId: '', productId: '', promotionId: '',
    budgetId: '', tradingTermId: '', baselineId: '',
    glAccount: '', costCenter: '',
    startDate: '', endDate: '',
    rate: 0, rateType: 'percentage', baseAmount: 0,
    currency: 'ZAR', autoCalculate: true, autoPost: false
  });

  const [reverseForm, setReverseForm] = useState({ amount: 0, reason: '' });

  const loadAccruals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.accrual_type = typeFilter;
      const response = await accrualService.getAll(params);
      setAccruals(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load accruals:', error);
      setAccruals([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await accrualService.getSummary();
      setSummary(response.data || null);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [custRes, prodRes, promoRes, baseRes, optRes] = await Promise.all([
        customerService.getAll({ limit: 200 }),
        productService.getAll({ limit: 200 }),
        promotionService.getAll({ limit: 200 }),
        baselineService.getAll({ limit: 200 }),
        accrualService.getOptions()
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPromotions(promoRes.data || []);
      setBaselines(baseRes.data || []);
      setOptions(optRes.data || null);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }, []);

  useEffect(() => { loadAccruals(); }, [loadAccruals]);
  useEffect(() => { loadSummary(); loadReferenceData(); }, [loadSummary, loadReferenceData]);

  const resetForm = () => {
    setForm({
      name: '', description: '', accrualType: 'promotion',
      calculationMethod: 'percentage_of_sales', frequency: 'monthly',
      customerId: '', productId: '', promotionId: '',
      budgetId: '', tradingTermId: '', baselineId: '',
      glAccount: '', costCenter: '',
      startDate: '', endDate: '',
      rate: 0, rateType: 'percentage', baseAmount: 0,
      currency: 'ZAR', autoCalculate: true, autoPost: false
    });
  };

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      await accrualService.create(form);
      setCreateOpen(false);
      resetForm();
      await loadAccruals();
      await loadSummary();
    } catch (error) {
      console.error('Failed to create accrual:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAccrual) return;
    setActionLoading(true);
    try {
      await accrualService.update(selectedAccrual.id, form);
      setEditOpen(false);
      resetForm();
      await loadAccruals();
    } catch (error) {
      console.error('Failed to update accrual:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this accrual and all its periods/journals?')) return;
    try {
      await accrualService.delete(id);
      await loadAccruals();
      await loadSummary();
    } catch (error) {
      console.error('Failed to delete accrual:', error);
      alert(error?.response?.data?.message || 'Cannot delete this accrual');
    }
  };

  const handleCalculate = async (id) => {
    setActionLoading(true);
    try {
      const result = await accrualService.calculate(id);
      if (result.success) {
        await loadAccruals();
        await loadSummary();
        if (selectedAccrual && selectedAccrual.id === id) {
          const detail = await accrualService.getById(id);
          setSelectedAccrual(detail.data);
        }
      }
    } catch (error) {
      console.error('Failed to calculate accrual:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!window.confirm('Post this accrual to GL? This will create journal entries.')) return;
    setActionLoading(true);
    try {
      const result = await accrualService.post(id);
      if (result.success) {
        await loadAccruals();
        await loadSummary();
        if (selectedAccrual && selectedAccrual.id === id) {
          const detail = await accrualService.getById(id);
          setSelectedAccrual(detail.data);
        }
      }
    } catch (error) {
      console.error('Failed to post accrual:', error);
      alert(error?.response?.data?.message || 'Failed to post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!selectedAccrual) return;
    setActionLoading(true);
    try {
      await accrualService.reverse(selectedAccrual.id, reverseForm);
      setReverseOpen(false);
      setReverseForm({ amount: 0, reason: '' });
      await loadAccruals();
      await loadSummary();
    } catch (error) {
      console.error('Failed to reverse accrual:', error);
      alert(error?.response?.data?.message || 'Failed to reverse');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this accrual?')) return;
    try {
      await accrualService.approve(id);
      await loadAccruals();
    } catch (error) {
      console.error('Failed to approve accrual:', error);
    }
  };

  const handleViewDetail = async (accrual) => {
    try {
      const detail = await accrualService.getById(accrual.id);
      setSelectedAccrual(detail.data);
      setDetailTab(0);
      setDetailOpen(true);
    } catch (error) {
      console.error('Failed to load accrual detail:', error);
    }
  };

  const handleOpenEdit = (accrual) => {
    setSelectedAccrual(accrual);
    setForm({
      name: accrual.name || '',
      description: accrual.description || '',
      accrualType: accrual.accrualType || accrual.accrual_type || 'promotion',
      calculationMethod: accrual.calculationMethod || accrual.calculation_method || 'percentage_of_sales',
      frequency: accrual.frequency || 'monthly',
      customerId: accrual.customerId || accrual.customer_id || '',
      productId: accrual.productId || accrual.product_id || '',
      promotionId: accrual.promotionId || accrual.promotion_id || '',
      budgetId: accrual.budgetId || accrual.budget_id || '',
      tradingTermId: accrual.tradingTermId || accrual.trading_term_id || '',
      baselineId: accrual.baselineId || accrual.baseline_id || '',
      glAccount: accrual.glAccount || accrual.gl_account || '',
      costCenter: accrual.costCenter || accrual.cost_center || '',
      startDate: accrual.startDate || accrual.start_date || '',
      endDate: accrual.endDate || accrual.end_date || '',
      rate: accrual.rate || 0,
      rateType: accrual.rateType || accrual.rate_type || 'percentage',
      baseAmount: accrual.baseAmount || accrual.base_amount || 0,
      currency: accrual.currency || 'ZAR',
      autoCalculate: accrual.autoCalculate ?? accrual.auto_calculate ?? true,
      autoPost: accrual.autoPost ?? accrual.auto_post ?? false
    });
    setEditOpen(true);
  };

  const handleOpenReverse = (accrual) => {
    setSelectedAccrual(accrual);
    setReverseForm({
      amount: accrual.postedAmount || accrual.posted_amount || 0,
      reason: ''
    });
    setReverseOpen(true);
  };

  const fmt = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const fmtR = (val) => {
    if (val === null || val === undefined) return '-';
    return `R${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderSummaryCards = () => {
    if (!summary) return null;
    const a = summary.accruals || {};
    const j = summary.journals || {};
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ mr: 1, color: '#7C3AED' }} />
                <Typography variant="body2" color="text.secondary">Total Accruals</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{a.total || 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {a.active || 0} active, {a.posted || 0} posted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: '#059669' }} />
                <Typography variant="body2" color="text.secondary">Total Accrued</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmtR(a.totalAccrued)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Posted: {fmtR(a.totalPosted)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Receipt sx={{ mr: 1, color: '#2563EB' }} />
                <Typography variant="body2" color="text.secondary">Settled</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmtR(a.totalSettled)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining: {fmtR(a.totalRemaining)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Gavel sx={{ mr: 1, color: '#DC2626' }} />
                <Typography variant="body2" color="text.secondary">GL Journals</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmt(j.total)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Reversed: {fmtR(a.totalReversed)}
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
        <TextField fullWidth label="Accrual Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Description" multiline rows={2} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Accrual Type" value={form.accrualType}
          onChange={(e) => setForm({ ...form, accrualType: e.target.value })}>
          {(options?.accrualTypes || [
            { value: 'promotion', label: 'Promotion Accrual' },
            { value: 'rebate', label: 'Rebate Accrual' },
            { value: 'trading_term', label: 'Trading Term Accrual' },
            { value: 'off_invoice', label: 'Off-Invoice Accrual' },
            { value: 'scan_back', label: 'Scan-Back Accrual' },
            { value: 'lump_sum', label: 'Lump Sum Accrual' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Calculation Method" value={form.calculationMethod}
          onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}>
          {(options?.calculationMethods || [
            { value: 'percentage_of_sales', label: 'Percentage of Sales' },
            { value: 'per_unit', label: 'Per Unit' },
            { value: 'lump_sum', label: 'Lump Sum' },
            { value: 'tiered', label: 'Tiered (Volume-based)' },
            { value: 'baseline_lift', label: 'Baseline Lift (Incremental)' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Frequency" value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
          {(options?.frequencies || [
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'annually', label: 'Annually' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Rate Type" value={form.rateType}
          onChange={(e) => setForm({ ...form, rateType: e.target.value })}>
          {(options?.rateTypes || [
            { value: 'percentage', label: 'Percentage (%)' },
            { value: 'fixed', label: 'Fixed Amount (R)' },
            { value: 'per_unit', label: 'Per Unit (R/unit)' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Rate" type="number" value={form.rate}
          onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })}
          inputProps={{ step: 0.01 }}
          helperText={form.rateType === 'percentage' ? 'e.g. 5 for 5%' : 'Amount in ZAR'} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Base Amount (for lump sum)" type="number" value={form.baseAmount}
          onChange={(e) => setForm({ ...form, baseAmount: parseFloat(e.target.value) || 0 })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Customer" value={form.customerId}
          onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
          <MenuItem value="">All Customers</MenuItem>
          {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Product" value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}>
          <MenuItem value="">All Products</MenuItem>
          {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
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
        <TextField select fullWidth label="Baseline (for lift calc)" value={form.baselineId}
          onChange={(e) => setForm({ ...form, baselineId: e.target.value })}>
          <MenuItem value="">None</MenuItem>
          {baselines.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Start Date" type="date" value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="End Date" type="date" value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>GL Configuration</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="GL Account (Debit)" value={form.glAccount}
          onChange={(e) => setForm({ ...form, glAccount: e.target.value })}
          placeholder="e.g. Trade Promotion Expense" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Cost Center (Credit)" value={form.costCenter}
          onChange={(e) => setForm({ ...form, costCenter: e.target.value })}
          placeholder="e.g. Trade Accrual Liability" />
      </Grid>
    </Grid>
  );

  const renderAccrualTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F9FAFB' }}>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Rate</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Accrued</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Posted</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Remaining</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accruals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No accruals found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : accruals.map((a) => (
            <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(a)}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.startDate || a.start_date || ''} — {a.endDate || a.end_date || ''}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip size="small" label={(a.accrualType || a.accrual_type || '').replace(/_/g, ' ')} />
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>{(a.calculationMethod || a.calculation_method || '').replace(/_/g, ' ')}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{a.frequency}</TableCell>
              <TableCell>
                <Chip size="small" color={STATUS_COLORS[a.status] || 'default'} label={a.status} />
              </TableCell>
              <TableCell align="right">
                {a.rate}{(a.rateType || a.rate_type) === 'percentage' ? '%' : ''}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtR(a.accruedAmount || a.accrued_amount)}</TableCell>
              <TableCell align="right">{fmtR(a.postedAmount || a.posted_amount)}</TableCell>
              <TableCell align="right" sx={{ color: '#DC2626' }}>{fmtR(a.remainingAmount || a.remaining_amount)}</TableCell>
              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Calculate">
                  <IconButton size="small" onClick={() => handleCalculate(a.id)} color="primary">
                    <Calculate fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Post to GL">
                  <IconButton size="small" onClick={() => handlePost(a.id)} sx={{ color: '#059669' }}>
                    <PostAdd fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleOpenEdit(a)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(a.id)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDetailDialog = () => {
    if (!selectedAccrual) return null;
    const a = selectedAccrual;
    const periods = a.periods || [];
    const journals = a.journals || [];

    return (
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{a.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {(a.accrualType || a.accrual_type || '').replace(/_/g, ' ')} | {a.frequency} | {fmtR(a.accruedAmount || a.accrued_amount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip size="small" color={STATUS_COLORS[a.status] || 'default'} label={a.status} />
            <Button size="small" startIcon={<Calculate />} variant="outlined"
              onClick={() => handleCalculate(a.id)} disabled={actionLoading}>
              Calculate
            </Button>
            <Button size="small" startIcon={<PostAdd />} variant="contained" color="success"
              onClick={() => handlePost(a.id)} disabled={actionLoading || a.status === 'draft'}>
              Post to GL
            </Button>
            {(a.postedAmount || a.posted_amount) > 0 && (
              <Button size="small" startIcon={<Undo />} variant="outlined" color="error"
                onClick={() => { setDetailOpen(false); handleOpenReverse(a); }}>
                Reverse
              </Button>
            )}
            {a.status === 'draft' && (
              <Button size="small" startIcon={<CheckCircle />} variant="outlined"
                onClick={() => handleApprove(a.id)}>
                Approve
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Periods (${periods.length})`} />
            <Tab label={`GL Journals (${journals.length})`} />
            <Tab label="Configuration" />
          </Tabs>

          {detailTab === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Base Sales</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Calculated</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Posted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No periods calculated yet. Click "Calculate" to generate.
                      </TableCell>
                    </TableRow>
                  ) : periods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{p.periodLabel || p.period_label}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {p.periodStart || p.period_start} — {p.periodEnd || p.period_end}
                      </TableCell>
                      <TableCell align="right">{fmtR(p.baseSales || p.base_sales)}</TableCell>
                      <TableCell align="right">{p.accrualRate || p.accrual_rate}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtR(p.calculatedAmount || p.calculated_amount)}</TableCell>
                      <TableCell align="right">{fmtR(p.postedAmount || p.posted_amount)}</TableCell>
                      <TableCell>
                        <Chip size="small"
                          color={p.status === 'posted' ? 'success' : p.status === 'calculated' ? 'info' : 'default'}
                          label={p.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {detailTab === 1 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Debit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Credit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Narration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {journals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No journal entries yet. Post the accrual to generate GL entries.
                      </TableCell>
                    </TableRow>
                  ) : journals.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{(j.journalDate || j.journal_date || '').split('T')[0]}</TableCell>
                      <TableCell>
                        <Chip size="small"
                          color={(j.journalType || j.journal_type) === 'reversal' ? 'error' : 'primary'}
                          label={j.journalType || j.journal_type} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{j.reference}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{j.debitAccount || j.debit_account}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{j.creditAccount || j.credit_account}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600,
                        color: (j.journalType || j.journal_type) === 'reversal' ? '#DC2626' : '#059669'
                      }}>
                        {(j.journalType || j.journal_type) === 'reversal' ? '-' : ''}{fmtR(j.amount)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {j.narration}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {detailTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{(a.accrualType || a.accrual_type || '').replace(/_/g, ' ')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Calculation Method</Typography>
                <Typography variant="body2">{(a.calculationMethod || a.calculation_method || '').replace(/_/g, ' ')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Frequency</Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{a.frequency}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Rate</Typography>
                <Typography variant="body2">{a.rate}{(a.rateType || a.rate_type) === 'percentage' ? '%' : ` ${a.rateType || a.rate_type}`}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">GL Account (Debit)</Typography>
                <Typography variant="body2">{a.glAccount || a.gl_account || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Cost Center (Credit)</Typography>
                <Typography variant="body2">{a.costCenter || a.cost_center || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Start Date</Typography>
                <Typography variant="body2">{a.startDate || a.start_date || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">End Date</Typography>
                <Typography variant="body2">{a.endDate || a.end_date || '-'}</Typography>
              </Grid>
              <Grid item xs={12}><Divider /></Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Total Accrued</Typography>
                <Typography variant="h6" sx={{ color: '#7C3AED' }}>{fmtR(a.accruedAmount || a.accrued_amount)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Total Posted</Typography>
                <Typography variant="h6" sx={{ color: '#059669' }}>{fmtR(a.postedAmount || a.posted_amount)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Remaining</Typography>
                <Typography variant="h6" sx={{ color: '#DC2626' }}>{fmtR(a.remainingAmount || a.remaining_amount)}</Typography>
              </Grid>
            </Grid>
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Accrual Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Calculate, post, and track trade promotion accruals for GL reporting
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => { loadAccruals(); loadSummary(); }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { resetForm(); setCreateOpen(true); }}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            New Accrual
          </Button>
        </Box>
      </Box>

      {renderSummaryCards()}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="posted">Posted</MenuItem>
          <MenuItem value="reversed">Reversed</MenuItem>
        </TextField>
        <TextField select size="small" label="Type" value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="promotion">Promotion</MenuItem>
          <MenuItem value="rebate">Rebate</MenuItem>
          <MenuItem value="trading_term">Trading Term</MenuItem>
          <MenuItem value="lump_sum">Lump Sum</MenuItem>
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
          {total} accrual{total !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderAccrualTable()
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Accrual</DialogTitle>
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
        <DialogTitle>Edit Accrual</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={actionLoading || !form.name}
            sx={{ bgcolor: '#7C3AED' }}>
            {actionLoading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reverse Dialog */}
      <Dialog open={reverseOpen} onClose={() => setReverseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Accrual</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will create a reversal journal entry for {selectedAccrual?.name}.
          </Typography>
          <TextField fullWidth label="Amount to Reverse" type="number" value={reverseForm.amount}
            onChange={(e) => setReverseForm({ ...reverseForm, amount: parseFloat(e.target.value) || 0 })}
            sx={{ mb: 2 }} />
          <TextField fullWidth label="Reason for Reversal" multiline rows={2} value={reverseForm.reason}
            onChange={(e) => setReverseForm({ ...reverseForm, reason: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReverse}
            disabled={actionLoading || !reverseForm.reason}>
            {actionLoading ? <CircularProgress size={20} /> : 'Reverse'}
          </Button>
        </DialogActions>
      </Dialog>

      {renderDetailDialog()}
    </Box>
  );
};

export default AccrualManagement;
