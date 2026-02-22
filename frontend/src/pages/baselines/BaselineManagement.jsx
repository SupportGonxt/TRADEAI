import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Card, CardContent,
  Paper, Chip, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tooltip, LinearProgress, Divider, Tabs, Tab
} from '@mui/material';
import {
  Add, Refresh, Calculate, CheckCircle, Delete, Edit,
  Timeline, TrendingUp, ShowChart,
  Assessment, Science
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { baselineService, customerService, productService, promotionService } from '../../services/api';

const STATUS_COLORS = {
  draft: 'default',
  calculating: 'info',
  active: 'success',
  approved: 'primary',
  archived: 'warning'
};

const BaselineManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [baselines, setBaselines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [decomposeOpen, setDecomposeOpen] = useState(false);
  const [selectedBaseline, setSelectedBaseline] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [options, setOptions] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', baselineType: 'volume',
    calculationMethod: 'historical_average', granularity: 'weekly',
    customerId: '', productId: '', category: '', brand: '',
    channel: '', region: '', startDate: '', endDate: '',
    baseYear: new Date().getFullYear() - 1, periodsUsed: 52,
    seasonalityEnabled: true, trendEnabled: true,
    outlierRemovalEnabled: true, outlierThreshold: 2.0,
    confidenceLevel: 0.85
  });

  const [decomposeForm, setDecomposeForm] = useState({
    promotionId: '', cannibalizationRate: 0.08,
    pantryLoadingRate: 0.05, haloRate: 0.03, pullForwardRate: 0.04
  });

  const loadBaselines = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.baseline_type = typeFilter;

      const response = await baselineService.getAll(params);
      setBaselines(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to load baselines:', error);
      setBaselines([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await baselineService.getSummary();
      setSummary(response.data || null);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [custRes, prodRes, promoRes, optRes] = await Promise.all([
        customerService.getAll({ limit: 200 }),
        productService.getAll({ limit: 200 }),
        promotionService.getAll({ limit: 200 }),
        baselineService.getOptions()
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPromotions(promoRes.data || []);
      setOptions(optRes.data || null);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  }, []);

  useEffect(() => { loadBaselines(); }, [loadBaselines]);
  useEffect(() => { loadSummary(); loadReferenceData(); }, [loadSummary, loadReferenceData]);

  const resetForm = () => {
    setForm({
      name: '', description: '', baselineType: 'volume',
      calculationMethod: 'historical_average', granularity: 'weekly',
      customerId: '', productId: '', category: '', brand: '',
      channel: '', region: '', startDate: '', endDate: '',
      baseYear: new Date().getFullYear() - 1, periodsUsed: 52,
      seasonalityEnabled: true, trendEnabled: true,
      outlierRemovalEnabled: true, outlierThreshold: 2.0,
      confidenceLevel: 0.85
    });
  };

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      await baselineService.create(form);
      setCreateOpen(false);
      resetForm();
      await loadBaselines();
      await loadSummary();
    } catch (error) {
      console.error('Failed to create baseline:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBaseline) return;
    setActionLoading(true);
    try {
      await baselineService.update(selectedBaseline.id, form);
      setEditOpen(false);
      resetForm();
      await loadBaselines();
    } catch (error) {
      console.error('Failed to update baseline:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this baseline and all its period data?')) return;
    try {
      await baselineService.delete(id);
      await loadBaselines();
      await loadSummary();
    } catch (error) {
      console.error('Failed to delete baseline:', error);
    }
  };

  const handleCalculate = async (id) => {
    setActionLoading(true);
    try {
      const result = await baselineService.calculate(id);
      if (result.success) {
        await loadBaselines();
        await loadSummary();
        if (selectedBaseline && selectedBaseline.id === id) {
          const detail = await baselineService.getById(id);
          setSelectedBaseline(detail.data);
        }
      }
    } catch (error) {
      console.error('Failed to calculate baseline:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this baseline?')) return;
    try {
      await baselineService.approve(id);
      await loadBaselines();
    } catch (error) {
      console.error('Failed to approve baseline:', error);
    }
  };

  const handleViewDetail = async (baseline) => {
    try {
      const detail = await baselineService.getById(baseline.id);
      setSelectedBaseline(detail.data);
      setDetailTab(0);
      setDetailOpen(true);
    } catch (error) {
      console.error('Failed to load baseline detail:', error);
    }
  };

  const handleOpenEdit = (baseline) => {
    setSelectedBaseline(baseline);
    setForm({
      name: baseline.name || '',
      description: baseline.description || '',
      baselineType: baseline.baselineType || baseline.baseline_type || 'volume',
      calculationMethod: baseline.calculationMethod || baseline.calculation_method || 'historical_average',
      granularity: baseline.granularity || 'weekly',
      customerId: baseline.customerId || baseline.customer_id || '',
      productId: baseline.productId || baseline.product_id || '',
      category: baseline.category || '',
      brand: baseline.brand || '',
      channel: baseline.channel || '',
      region: baseline.region || '',
      startDate: baseline.startDate || baseline.start_date || '',
      endDate: baseline.endDate || baseline.end_date || '',
      baseYear: baseline.baseYear || baseline.base_year || new Date().getFullYear() - 1,
      periodsUsed: baseline.periodsUsed || baseline.periods_used || 52,
      seasonalityEnabled: baseline.seasonalityEnabled ?? baseline.seasonality_enabled ?? true,
      trendEnabled: baseline.trendEnabled ?? baseline.trend_enabled ?? true,
      outlierRemovalEnabled: baseline.outlierRemovalEnabled ?? baseline.outlier_removal_enabled ?? true,
      outlierThreshold: baseline.outlierThreshold || baseline.outlier_threshold || 2.0,
      confidenceLevel: baseline.confidenceLevel || baseline.confidence_level || 0.85
    });
    setEditOpen(true);
  };

  const handleDecompose = async () => {
    if (!selectedBaseline || !decomposeForm.promotionId) return;
    setActionLoading(true);
    try {
      await baselineService.decompose(selectedBaseline.id, decomposeForm);
      setDecomposeOpen(false);
      const detail = await baselineService.getById(selectedBaseline.id);
      setSelectedBaseline(detail.data);
    } catch (error) {
      console.error('Failed to decompose volume:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (val, decimals = 0) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('en-ZA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const fmtPct = (val) => {
    if (val === null || val === undefined) return '-';
    return `${Number(val).toFixed(1)}%`;
  };

  const renderFormFields = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField fullWidth label="Baseline Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Description" multiline rows={2} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Baseline Type" value={form.baselineType}
          onChange={(e) => setForm({ ...form, baselineType: e.target.value })}>
          {(options?.baselineTypes || [
            { value: 'volume', label: 'Volume Baseline' },
            { value: 'revenue', label: 'Revenue Baseline' },
            { value: 'units', label: 'Units Baseline' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Calculation Method" value={form.calculationMethod}
          onChange={(e) => setForm({ ...form, calculationMethod: e.target.value })}>
          {(options?.calculationMethods || [
            { value: 'historical_average', label: 'Historical Average' },
            { value: 'moving_average', label: 'Moving Average (12-week)' },
            { value: 'weighted_moving_average', label: 'Weighted Moving Average' },
            { value: 'linear_regression', label: 'Linear Regression (Trend)' },
            { value: 'seasonal_decomposition', label: 'Seasonal Decomposition' },
            { value: 'exponential_smoothing', label: 'Exponential Smoothing' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField select fullWidth label="Granularity" value={form.granularity}
          onChange={(e) => setForm({ ...form, granularity: e.target.value })}>
          {(options?.granularities || [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' }
          ]).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Base Year" type="number" value={form.baseYear}
          onChange={(e) => setForm({ ...form, baseYear: parseInt(e.target.value) })} />
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
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Advanced Settings</Typography>
      </Grid>
      <Grid item xs={4}>
        <TextField fullWidth label="Periods Used" type="number" value={form.periodsUsed}
          onChange={(e) => setForm({ ...form, periodsUsed: parseInt(e.target.value) })} />
      </Grid>
      <Grid item xs={4}>
        <TextField fullWidth label="Outlier Threshold" type="number" value={form.outlierThreshold}
          onChange={(e) => setForm({ ...form, outlierThreshold: parseFloat(e.target.value) })}
          inputProps={{ step: 0.1 }} />
      </Grid>
      <Grid item xs={4}>
        <TextField fullWidth label="Confidence Level" type="number" value={form.confidenceLevel}
          onChange={(e) => setForm({ ...form, confidenceLevel: parseFloat(e.target.value) })}
          inputProps={{ step: 0.05, min: 0, max: 1 }} />
      </Grid>
    </Grid>
  );

  const renderSummaryCards = () => {
    if (!summary) return null;
    const b = summary.baselines || {};
    const d = summary.decomposition || {};
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline sx={{ mr: 1, color: '#7C3AED' }} />
                <Typography variant="body2" color="text.secondary">Total Baselines</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{b.total || 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {b.active || 0} active, {b.draft || 0} draft
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShowChart sx={{ mr: 1, color: '#2563EB' }} />
                <Typography variant="body2" color="text.secondary">Avg Confidence</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmtPct((b.avgConfidence || 0) * 100)}</Typography>
              <Typography variant="caption" color="text.secondary">
                MAPE: {fmtPct(b.avgMAPE || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: '#059669' }} />
                <Typography variant="body2" color="text.secondary">Total Base Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>R{fmt(b.totalBaseRevenue || 0)}</Typography>
              <Typography variant="caption" color="text.secondary">
                R² avg: {(b.avgRSquared || 0).toFixed(3)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assessment sx={{ mr: 1, color: '#DC2626' }} />
                <Typography variant="body2" color="text.secondary">Incremental Volume</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{fmt(d.totalIncrementalVolume || 0)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Lift: {fmtPct(d.avgLiftPct || 0)} | Avg ROI: {(d.avgROI || 0).toFixed(2)}x
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderBaselineTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F9FAFB' }}>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Granularity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Base Volume</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">Confidence</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">MAPE</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {baselines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">
                  No baselines found. Create one to get started.
                </Typography>
              </TableCell>
            </TableRow>
          ) : baselines.map((b) => (
            <TableRow key={b.id} hover sx={{ cursor: 'pointer' }}
              onClick={() => handleViewDetail(b)}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {b.description || `Base year: ${b.baseYear || b.base_year || '-'}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={b.baselineType || b.baseline_type || 'volume'} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {(b.calculationMethod || b.calculation_method || 'historical_average').replace(/_/g, ' ')}
                </Typography>
              </TableCell>
              <TableCell>{b.granularity || 'weekly'}</TableCell>
              <TableCell>
                <Chip label={b.status || 'draft'} size="small"
                  color={STATUS_COLORS[b.status] || 'default'} />
              </TableCell>
              <TableCell align="right">
                {fmt(b.totalBaseVolume || b.total_base_volume || 0)}
              </TableCell>
              <TableCell align="right">
                {fmtPct((b.confidenceLevel || b.confidence_level || 0) * 100)}
              </TableCell>
              <TableCell align="right">
                {fmtPct(b.mape || 0)}
              </TableCell>
              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  <Tooltip title="Calculate Baseline">
                    <IconButton size="small" color="primary"
                      onClick={() => handleCalculate(b.id)} disabled={actionLoading}>
                      <Calculate fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpenEdit(b)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {b.status === 'active' && (
                    <Tooltip title="Approve">
                      <IconButton size="small" color="success"
                        onClick={() => handleApprove(b.id)}>
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error"
                      onClick={() => handleDelete(b.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDetailDialog = () => {
    if (!selectedBaseline) return null;
    const b = selectedBaseline;
    const periods = b.periods || [];
    const decomps = b.decompositions || [];

    return (
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{b.name}</Typography>
            <Typography variant="caption" color="text.secondary">{b.description}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={b.status} color={STATUS_COLORS[b.status] || 'default'} />
            <Button size="small" variant="outlined" startIcon={<Calculate />}
              onClick={() => handleCalculate(b.id)} disabled={actionLoading}>
              Recalculate
            </Button>
            <Button size="small" variant="contained" startIcon={<Science />}
              onClick={() => { setDecomposeOpen(true); }}>
              Decompose
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Total Base Volume</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {fmt(b.totalBaseVolume || b.total_base_volume || 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Avg Weekly</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {fmt(b.avgWeeklyVolume || b.avg_weekly_volume || 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Confidence</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {fmtPct((b.confidenceLevel || b.confidence_level || 0) * 100)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">R²</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {(b.rSquared || b.r_squared || 0).toFixed(3)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Period Data (${periods.length})`} />
            <Tab label={`Volume Decompositions (${decomps.length})`} />
            <Tab label="Configuration" />
          </Tabs>

          {detailTab === 0 && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Base Volume</TableCell>
                    <TableCell align="right">Seasonality</TableCell>
                    <TableCell align="right">Trend Adj</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell align="right">Var %</TableCell>
                    <TableCell>Promoted</TableCell>
                    <TableCell align="right">Incremental</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No period data. Click &quot;Recalculate&quot; to generate.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : periods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.periodNumber || p.period_number}</TableCell>
                      <TableCell>{p.periodLabel || p.period_label || `${p.periodStart || p.period_start}`}</TableCell>
                      <TableCell align="right">{fmt(p.baseVolume || p.base_volume, 2)}</TableCell>
                      <TableCell align="right">{(p.seasonalityFactor || p.seasonality_factor || 1).toFixed(2)}</TableCell>
                      <TableCell align="right">{fmt(p.trendAdjustment || p.trend_adjustment, 2)}</TableCell>
                      <TableCell align="right">{fmt(p.actualVolume || p.actual_volume, 2)}</TableCell>
                      <TableCell align="right" sx={{
                        color: (p.varianceVolume || p.variance_volume || 0) >= 0 ? 'success.main' : 'error.main'
                      }}>
                        {fmt(p.varianceVolume || p.variance_volume, 2)}
                      </TableCell>
                      <TableCell align="right" sx={{
                        color: (p.variancePct || p.variance_pct || 0) >= 0 ? 'success.main' : 'error.main'
                      }}>
                        {fmtPct(p.variancePct || p.variance_pct)}
                      </TableCell>
                      <TableCell>
                        {(p.isPromoted || p.is_promoted) ?
                          <Chip label="Yes" size="small" color="warning" /> :
                          <Chip label="No" size="small" variant="outlined" />}
                      </TableCell>
                      <TableCell align="right">{fmt(p.incrementalVolume || p.incremental_volume, 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {detailTab === 1 && (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Total Vol</TableCell>
                    <TableCell align="right">Base Vol</TableCell>
                    <TableCell align="right">Incremental</TableCell>
                    <TableCell align="right">Cannibal.</TableCell>
                    <TableCell align="right">Pantry</TableCell>
                    <TableCell align="right">Halo</TableCell>
                    <TableCell align="right">Lift %</TableCell>
                    <TableCell align="right">ROI</TableCell>
                    <TableCell align="right">Efficiency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {decomps.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No decompositions. Click &quot;Decompose&quot; to analyze a promotion.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : decomps.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.periodStart || d.period_start} to {d.periodEnd || d.period_end}</TableCell>
                      <TableCell align="right">{fmt(d.totalVolume || d.total_volume, 0)}</TableCell>
                      <TableCell align="right">{fmt(d.baseVolume || d.base_volume, 0)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {fmt(d.incrementalVolume || d.incremental_volume, 0)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {fmt(d.cannibalizationVolume || d.cannibalization_volume, 0)}
                      </TableCell>
                      <TableCell align="right">{fmt(d.pantryLoadingVolume || d.pantry_loading_volume, 0)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        {fmt(d.haloVolume || d.halo_volume, 0)}
                      </TableCell>
                      <TableCell align="right">{fmtPct(d.liftPct || d.lift_pct)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {(d.roi || 0).toFixed(2)}x
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate"
                            value={Math.min(100, d.efficiencyScore || d.efficiency_score || 0)}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                          <Typography variant="caption">
                            {fmt(d.efficiencyScore || d.efficiency_score, 0)}
                          </Typography>
                        </Box>
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
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Calculation Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">Type: {b.baselineType || b.baseline_type}</Typography>
                    <Typography variant="body2">Method: {(b.calculationMethod || b.calculation_method || '').replace(/_/g, ' ')}</Typography>
                    <Typography variant="body2">Granularity: {b.granularity}</Typography>
                    <Typography variant="body2">Base Year: {b.baseYear || b.base_year}</Typography>
                    <Typography variant="body2">Periods Used: {b.periodsUsed || b.periods_used}</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Statistical Settings</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">Seasonality: {(b.seasonalityEnabled || b.seasonality_enabled) ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography variant="body2">Trend: {(b.trendEnabled || b.trend_enabled) ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography variant="body2">Outlier Removal: {(b.outlierRemovalEnabled || b.outlier_removal_enabled) ? 'Enabled' : 'Disabled'}</Typography>
                    <Typography variant="body2">Outlier Threshold: {b.outlierThreshold || b.outlier_threshold || 2.0} IQR</Typography>
                    <Typography variant="body2">Trend Coefficient: {(b.trendCoefficient || b.trend_coefficient || 0).toFixed(4)}</Typography>
                    <Typography variant="body2">MAPE: {fmtPct(b.mape || 0)}</Typography>
                  </Box>
                </Paper>
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Baseline Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statistical baseline calculation for promotions — what sales would be without a promotion
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField select size="small" value={statusFilter} sx={{ minWidth: 120 }}
            onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
          <TextField select size="small" value={typeFilter} sx={{ minWidth: 120 }}
            onChange={(e) => setTypeFilter(e.target.value)} label="Type">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="volume">Volume</MenuItem>
            <MenuItem value="revenue">Revenue</MenuItem>
            <MenuItem value="units">Units</MenuItem>
          </TextField>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadBaselines}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { resetForm(); setCreateOpen(true); }}>
            New Baseline
          </Button>
        </Box>
      </Box>

      {actionLoading && <LinearProgress sx={{ mb: 2 }} />}

      {renderSummaryCards()}
      {renderBaselineTable()}
      {renderDetailDialog()}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Baseline</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={actionLoading || !form.name}>
            {actionLoading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Baseline</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>{renderFormFields()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={actionLoading || !form.name}>
            {actionLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={decomposeOpen} onClose={() => setDecomposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Volume Decomposition</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Decompose actual sales into base + incremental + cannibalization + pantry loading + halo effects
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Promotion" required
                value={decomposeForm.promotionId}
                onChange={(e) => setDecomposeForm({ ...decomposeForm, promotionId: e.target.value })}>
                {promotions.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cannibalization Rate" type="number"
                value={decomposeForm.cannibalizationRate}
                onChange={(e) => setDecomposeForm({ ...decomposeForm, cannibalizationRate: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01, min: 0, max: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Pantry Loading Rate" type="number"
                value={decomposeForm.pantryLoadingRate}
                onChange={(e) => setDecomposeForm({ ...decomposeForm, pantryLoadingRate: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01, min: 0, max: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Halo Rate" type="number"
                value={decomposeForm.haloRate}
                onChange={(e) => setDecomposeForm({ ...decomposeForm, haloRate: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01, min: 0, max: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Pull-Forward Rate" type="number"
                value={decomposeForm.pullForwardRate}
                onChange={(e) => setDecomposeForm({ ...decomposeForm, pullForwardRate: parseFloat(e.target.value) })}
                inputProps={{ step: 0.01, min: 0, max: 1 }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecomposeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDecompose}
            disabled={actionLoading || !decomposeForm.promotionId}>
            {actionLoading ? <CircularProgress size={20} /> : 'Analyze'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaselineManagement;
