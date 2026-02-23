import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Snackbar, Tooltip,
  LinearProgress, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as OptimizeIcon,
  Lightbulb as RecommendIcon,
  CheckCircle as ApplyIcon,
  Cancel as DismissIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendUpIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { promotionOptimizerService, customerService, productService } from '../../services/api';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (Math.abs(num) >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num.toFixed(0)}`;
};

const formatPct = (value) => `${(parseFloat(value) || 0).toFixed(1)}%`;

const SummaryCard = ({ title, value, subtitle, icon, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mt: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}15` }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const riskColor = (level) => {
  if (level === 'low') return { bg: '#D1FAE5', text: '#059669' };
  if (level === 'high') return { bg: '#FEE2E2', text: '#DC2626' };
  return { bg: '#FEF3C7', text: '#D97706' };
};

const statusColor = (status) => {
  if (status === 'optimized') return { bg: '#DBEAFE', text: '#2563EB' };
  if (status === 'applied') return { bg: '#D1FAE5', text: '#059669' };
  if (status === 'rejected') return { bg: '#FEE2E2', text: '#DC2626' };
  return { bg: '#F3F4F6', text: '#6B7280' };
};

const EMPTY_OPT = {
  name: '', description: '', optimizationType: 'roi_maximize', objective: 'maximize_roi',
  customerId: '', customerName: '', productId: '', productName: '',
  category: '', brand: '', channel: '', region: '',
  startDate: '', endDate: '',
  budgetLimit: 0, minRoiThreshold: 0, minLiftThreshold: 0, maxDiscountPct: 50,
  baselineRevenue: 0, baselineUnits: 0, baselineMarginPct: 25, notes: '',
};

const PromotionOptimizerManagement = () => {
  const [tab, setTab] = useState(0);
  const [optimizations, setOptimizations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [optDialog, setOptDialog] = useState(false);
  const [optForm, setOptForm] = useState(EMPTY_OPT);
  const [editingId, setEditingId] = useState(null);

  const [detailDialog, setDetailDialog] = useState(false);
  const [detailOpt, setDetailOpt] = useState(null);
  const [detailRecs, setDetailRecs] = useState([]);
  const [detailConstraints, setDetailConstraints] = useState([]);
  const [activeOptId, setActiveOptId] = useState(null);

  const [conDialog, setConDialog] = useState(false);
  const [conForm, setConForm] = useState({ constraintName: '', constraintType: 'budget', operator: 'lte', thresholdValue: 0, severity: 'warning' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const fetchOptimizations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await promotionOptimizerService.getAll();
      setOptimizations(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load optimizations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await promotionOptimizerService.getSummary();
      setSummary(res.data || null);
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [optRes, custRes, prodRes] = await Promise.all([
        promotionOptimizerService.getOptions(),
        customerService.getAll({ limit: 500 }),
        productService.getAll({ limit: 500 }),
      ]);
      setOptions(optRes.data || null);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (e) {
      console.error('Ref data fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchOptimizations();
    fetchSummary();
    fetchRefData();
  }, [fetchOptimizations, fetchSummary, fetchRefData]);

  const handleCreate = () => {
    setOptForm(EMPTY_OPT);
    setEditingId(null);
    setOptDialog(true);
  };

  const handleEdit = (o) => {
    setOptForm({
      name: o.name || '',
      description: o.description || '',
      optimizationType: o.optimizationType || o.optimization_type || 'roi_maximize',
      objective: o.objective || 'maximize_roi',
      customerId: o.customerId || o.customer_id || '',
      customerName: o.customerName || o.customer_name || '',
      productId: o.productId || o.product_id || '',
      productName: o.productName || o.product_name || '',
      category: o.category || '',
      brand: o.brand || '',
      channel: o.channel || '',
      region: o.region || '',
      startDate: (o.startDate || o.start_date || '').split('T')[0],
      endDate: (o.endDate || o.end_date || '').split('T')[0],
      budgetLimit: o.budgetLimit || o.budget_limit || 0,
      minRoiThreshold: o.minRoiThreshold || o.min_roi_threshold || 0,
      minLiftThreshold: o.minLiftThreshold || o.min_lift_threshold || 0,
      maxDiscountPct: o.maxDiscountPct || o.max_discount_pct || 50,
      baselineRevenue: o.baselineRevenue || o.baseline_revenue || 0,
      baselineUnits: o.baselineUnits || o.baseline_units || 0,
      baselineMarginPct: o.baselineMarginPct || o.baseline_margin_pct || 25,
      notes: o.notes || '',
    });
    setEditingId(o.id);
    setOptDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await promotionOptimizerService.update(editingId, optForm);
        showSnack('Optimization updated');
      } else {
        await promotionOptimizerService.create(optForm);
        showSnack('Optimization created');
      }
      setOptDialog(false);
      fetchOptimizations();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this optimization and all its recommendations/constraints?')) return;
    try {
      await promotionOptimizerService.delete(id);
      showSnack('Optimization deleted');
      fetchOptimizations();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleViewDetail = async (o) => {
    try {
      const res = await promotionOptimizerService.getById(o.id);
      const data = res.data || {};
      setDetailOpt(data);
      setDetailRecs(data.recommendations || []);
      setDetailConstraints(data.constraints || []);
      setActiveOptId(o.id);
      setDetailDialog(true);
    } catch (e) {
      showSnack(e.message || 'Failed to load optimization', 'error');
    }
  };

  const handleOptimize = async (id) => {
    try {
      setLoading(true);
      const res = await promotionOptimizerService.optimize(id);
      showSnack('Optimization complete');
      const data = res.data || {};
      setDetailOpt(data);
      setDetailRecs(data.recommendations || []);
      setDetailConstraints(data.constraints || []);
      fetchOptimizations();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Optimization failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecAction = async (recId, action) => {
    try {
      await promotionOptimizerService.updateRecommendationAction(activeOptId, recId, { action });
      showSnack(`Recommendation ${action}`);
      const res = await promotionOptimizerService.getById(activeOptId);
      const data = res.data || {};
      setDetailRecs(data.recommendations || []);
    } catch (e) {
      showSnack(e.message || 'Action failed', 'error');
    }
  };

  const handleAddConstraint = () => {
    setConForm({ constraintName: '', constraintType: 'budget', operator: 'lte', thresholdValue: 0, severity: 'warning' });
    setConDialog(true);
  };

  const handleSaveConstraint = async () => {
    try {
      await promotionOptimizerService.addConstraint(activeOptId, conForm);
      showSnack('Constraint added');
      setConDialog(false);
      const res = await promotionOptimizerService.getById(activeOptId);
      setDetailConstraints(res.data?.constraints || []);
    } catch (e) {
      showSnack(e.message || 'Failed to add constraint', 'error');
    }
  };

  const handleDeleteConstraint = async (conId) => {
    try {
      await promotionOptimizerService.deleteConstraint(activeOptId, conId);
      showSnack('Constraint deleted');
      const res = await promotionOptimizerService.getById(activeOptId);
      setDetailConstraints(res.data?.constraints || []);
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleCustomerSelect = (id) => {
    const c = customers.find(x => x.id === id);
    setOptForm(prev => ({ ...prev, customerId: id, customerName: c?.name || '' }));
  };

  const handleProductSelect = (id) => {
    const p = products.find(x => x.id === id);
    setOptForm(prev => ({ ...prev, productId: id, productName: p?.name || '' }));
  };

  const optimizationTypes = options?.optimizationTypes || [];
  const objectives = options?.objectives || [];
  const constraintTypes = options?.constraintTypes || [];
  const operators = options?.operators || [];
  const riskLevels = options?.riskLevels || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Promotion Optimization Engine
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            AI-powered optimization of promotion parameters — maximize ROI, revenue, profit, or volume
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchOptimizations(); fetchSummary(); }}
            sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            New Optimization
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Total Optimizations" value={summary?.total || 0}
            subtitle={`${summary?.optimizedCount || 0} optimized, ${summary?.appliedCount || 0} applied`}
            icon={<TuneIcon />} color="#7C3AED" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Avg ROI" value={formatPct(summary?.avgRoi)}
            subtitle={`Avg lift: ${formatPct(summary?.avgLift)}`}
            icon={<TrendUpIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Avg Improvement" value={formatPct(summary?.avgImprovement)}
            subtitle={`Confidence: ${formatPct(summary?.avgConfidence)}`}
            icon={<SpeedIcon />} color="#2563EB" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Recommendations" value={summary?.recommendations?.total || 0}
            subtitle={`${summary?.recommendations?.pending || 0} pending`}
            icon={<RecommendIcon />} color="#D97706" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
        <Tab label={`All (${optimizations.length})`} />
        <Tab label="Optimized" />
        <Tab label="Applied" />
      </Tabs>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Optimization</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Optimized ROI</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Revenue</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Improvement</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Confidence</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              const filtered = tab === 1 ? optimizations.filter(o => (o.status) === 'optimized')
                : tab === 2 ? optimizations.filter(o => (o.status) === 'applied')
                : optimizations;
              if (filtered.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                      {tab === 0 ? 'No optimizations yet. Click "New Optimization" to create one.' : 'No matching optimizations.'}
                    </TableCell>
                  </TableRow>
                );
              }
              return filtered.map((o) => {
                const typeInfo = optimizationTypes.find(t => t.value === (o.optimizationType || o.optimization_type));
                const stat = statusColor(o.status);
                return (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.name}</Typography>
                      {(o.customerName || o.customer_name) && (
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{o.customerName || o.customer_name}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={typeInfo?.label || (o.optimizationType || o.optimization_type)} size="small"
                        sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={o.status} size="small"
                        sx={{ bgcolor: stat.bg, color: stat.text, fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: (o.optimizedRoi || o.optimized_roi || 0) > 0 ? '#059669' : '#DC2626' }}>
                        {formatPct(o.optimizedRoi || o.optimized_roi)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(o.optimizedRevenue || o.optimized_revenue)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: (o.improvementPct || o.improvement_pct || 0) > 0 ? '#059669' : '#6B7280' }}>
                        {(o.improvementPct || o.improvement_pct || 0) > 0 ? '+' : ''}{formatPct(o.improvementPct || o.improvement_pct)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPct(o.confidenceScore || o.confidence_score)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View & Optimize"><IconButton size="small" onClick={() => handleViewDetail(o)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(o)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(o.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={optDialog} onClose={() => setOptDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit Optimization' : 'New Optimization'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth size="small" label="Optimization Name" required
                value={optForm.name} onChange={(e) => setOptForm(p => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Optimization Type"
                value={optForm.optimizationType} onChange={(e) => setOptForm(p => ({ ...p, optimizationType: e.target.value }))}>
                {optimizationTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2}
                value={optForm.description} onChange={(e) => setOptForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Objective"
                value={optForm.objective} onChange={(e) => setOptForm(p => ({ ...p, objective: e.target.value }))}>
                {objectives.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Customer"
                value={optForm.customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
                <MenuItem value="">All Customers</MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Product"
                value={optForm.productId} onChange={(e) => handleProductSelect(e.target.value)}>
                <MenuItem value="">All Products</MenuItem>
                {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Start Date" type="date" InputLabelProps={{ shrink: true }}
                value={optForm.startDate} onChange={(e) => setOptForm(p => ({ ...p, startDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="End Date" type="date" InputLabelProps={{ shrink: true }}
                value={optForm.endDate} onChange={(e) => setOptForm(p => ({ ...p, endDate: e.target.value }))} />
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>Constraints & Thresholds</Typography></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Budget Limit (R)" type="number"
                value={optForm.budgetLimit} onChange={(e) => setOptForm(p => ({ ...p, budgetLimit: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Min ROI %" type="number"
                value={optForm.minRoiThreshold} onChange={(e) => setOptForm(p => ({ ...p, minRoiThreshold: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Min Lift %" type="number"
                value={optForm.minLiftThreshold} onChange={(e) => setOptForm(p => ({ ...p, minLiftThreshold: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Max Discount %" type="number"
                value={optForm.maxDiscountPct} onChange={(e) => setOptForm(p => ({ ...p, maxDiscountPct: parseFloat(e.target.value) || 0 }))} />
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>Baseline Assumptions</Typography></Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Baseline Revenue (R)" type="number"
                value={optForm.baselineRevenue} onChange={(e) => setOptForm(p => ({ ...p, baselineRevenue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Baseline Units" type="number"
                value={optForm.baselineUnits} onChange={(e) => setOptForm(p => ({ ...p, baselineUnits: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Baseline Margin %" type="number"
                value={optForm.baselineMarginPct} onChange={(e) => setOptForm(p => ({ ...p, baselineMarginPct: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={optForm.notes} onChange={(e) => setOptForm(p => ({ ...p, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOptDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!optForm.name}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAIL / OPTIMIZATION DIALOG */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {detailOpt?.name || 'Optimization Details'}
            {detailOpt?.status && (
              <Chip label={detailOpt.status} size="small" sx={{ ml: 1, ...(() => { const s = statusColor(detailOpt.status); return { bgcolor: s.bg, color: s.text }; })(), fontWeight: 600 }} />
            )}
          </Box>
          <Button variant="contained" startIcon={<OptimizeIcon />} onClick={() => handleOptimize(activeOptId)}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Run Optimization
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {detailOpt && (
            <Box>
              {detailOpt.status === 'optimized' && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  Optimization complete — {detailRecs.length} recommendations generated with {formatPct(detailOpt.confidenceScore || detailOpt.confidence_score)} confidence
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Optimized ROI</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#7C3AED' }}>{formatPct(detailOpt.optimizedRoi || detailOpt.optimized_roi)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Revenue</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatCurrency(detailOpt.optimizedRevenue || detailOpt.optimized_revenue)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Lift %</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>{formatPct(detailOpt.optimizedLiftPct || detailOpt.optimized_lift_pct)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Net Profit</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(detailOpt.optimizedNetProfit || detailOpt.optimized_net_profit)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Improvement</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: (detailOpt.improvementPct || detailOpt.improvement_pct || 0) > 0 ? '#059669' : '#6B7280' }}>
                    {(detailOpt.improvementPct || detailOpt.improvement_pct || 0) > 0 ? '+' : ''}{formatPct(detailOpt.improvementPct || detailOpt.improvement_pct)}
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Confidence</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatPct(detailOpt.confidenceScore || detailOpt.confidence_score)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              {/* CONSTRAINTS */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Constraints ({detailConstraints.length})</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddConstraint} sx={{ color: '#7C3AED' }}>Add Constraint</Button>
              </Box>

              {detailConstraints.length === 0 ? (
                <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#F9FAFB', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">No constraints defined. Add constraints to guide the optimizer.</Typography>
                </Card>
              ) : (
                <Box sx={{ mb: 2 }}>
                  {detailConstraints.map((con) => {
                    const violated = con.isViolated || con.is_violated;
                    return (
                      <Card key={con.id} sx={{ p: 2, mb: 1, borderRadius: 2, border: `1px solid ${violated ? '#FCA5A5' : '#E5E7EB'}`, bgcolor: violated ? '#FEF2F2' : 'transparent' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{con.constraintName || con.constraint_name}</Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                              {con.constraintType || con.constraint_type} {con.operator} {con.thresholdValue || con.threshold_value}
                              {(con.currentValue || con.current_value) ? ` (current: ${Math.round((con.currentValue || con.current_value) * 100) / 100})` : ''}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {violated ? (
                              <Chip label="Violated" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: '0.7rem' }} />
                            ) : (con.currentValue || con.current_value) ? (
                              <Chip label="Met" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 600, fontSize: '0.7rem' }} />
                            ) : null}
                            <IconButton size="small" color="error" onClick={() => handleDeleteConstraint(con.id)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* RECOMMENDATIONS */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Recommendations ({detailRecs.length})</Typography>

              {detailRecs.length === 0 ? (
                <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#F9FAFB', mb: 2 }}>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>No recommendations yet</Typography>
                  <Typography variant="caption" color="text.secondary">Run the optimization to generate AI-powered recommendations</Typography>
                </Card>
              ) : (
                <Box sx={{ mb: 2 }}>
                  {detailRecs.map((r) => {
                    const risk = riskColor(r.riskLevel || r.risk_level);
                    const action = r.actionTaken || r.action_taken || 'pending';
                    return (
                      <Card key={r.id} sx={{ p: 2, mb: 1.5, borderRadius: 2, border: '1px solid #E5E7EB', opacity: action === 'dismissed' ? 0.6 : 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.title}</Typography>
                              <Chip label={r.recommendationType || r.recommendation_type} size="small"
                                sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontSize: '0.65rem', height: 20 }} />
                              <Chip label={r.riskLevel || r.risk_level || 'medium'} size="small"
                                sx={{ bgcolor: risk.bg, color: risk.text, fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: '#4B5563' }}>{r.description}</Typography>
                            {r.rationale && (
                              <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mt: 0.5, fontStyle: 'italic' }}>{r.rationale}</Typography>
                            )}
                          </Box>
                        </Box>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          <Grid item xs={3}>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>Revenue Impact</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(r.expectedImpactRevenue || r.expected_impact_revenue)}</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>ROI Impact</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>{formatPct(r.expectedImpactRoi || r.expected_impact_roi)}</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>Confidence</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPct(r.confidence)}</Typography>
                          </Grid>
                          <Grid item xs={3} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 0.5 }}>
                            {action === 'pending' ? (
                              <>
                                <Tooltip title="Apply">
                                  <IconButton size="small" onClick={() => handleRecAction(r.id, 'applied')} sx={{ color: '#059669' }}>
                                    <ApplyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Dismiss">
                                  <IconButton size="small" onClick={() => handleRecAction(r.id, 'dismissed')} sx={{ color: '#DC2626' }}>
                                    <DismissIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Chip label={action} size="small"
                                sx={{ bgcolor: action === 'applied' ? '#D1FAE5' : '#F3F4F6', color: action === 'applied' ? '#059669' : '#6B7280', fontWeight: 600, fontSize: '0.7rem' }} />
                            )}
                          </Grid>
                        </Grid>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="outlined" onClick={() => { setDetailDialog(false); handleEdit(detailOpt); }}
            sx={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
            Edit Optimization
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD CONSTRAINT DIALOG */}
      <Dialog open={conDialog} onClose={() => setConDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Constraint</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Constraint Name" required
                value={conForm.constraintName} onChange={(e) => setConForm(p => ({ ...p, constraintName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Type"
                value={conForm.constraintType} onChange={(e) => setConForm(p => ({ ...p, constraintType: e.target.value }))}>
                {constraintTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Operator"
                value={conForm.operator} onChange={(e) => setConForm(p => ({ ...p, operator: e.target.value }))}>
                {operators.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Threshold Value" type="number"
                value={conForm.thresholdValue} onChange={(e) => setConForm(p => ({ ...p, thresholdValue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Severity"
                value={conForm.severity} onChange={(e) => setConForm(p => ({ ...p, severity: e.target.value }))}>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveConstraint} disabled={!conForm.constraintName}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PromotionOptimizerManagement;
