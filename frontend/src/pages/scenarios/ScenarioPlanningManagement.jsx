import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Snackbar, Tooltip,
  LinearProgress, Slider, Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PlayArrow as SimulateIcon,
  Compare as CompareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Visibility as ViewIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { scenarioService, customerService, productService, promotionService, budgetService } from '../../services/api';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (Math.abs(num) >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num.toFixed(0)}`;
};

const formatNumber = (value) => {
  const num = parseFloat(value) || 0;
  if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toFixed(0);
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
  if (status === 'simulated') return { bg: '#DBEAFE', text: '#2563EB' };
  if (status === 'approved') return { bg: '#D1FAE5', text: '#059669' };
  if (status === 'rejected') return { bg: '#FEE2E2', text: '#DC2626' };
  return { bg: '#F3F4F6', text: '#6B7280' };
};

const EMPTY_SCENARIO = {
  name: '', description: '', scenarioType: 'promotion', status: 'draft',
  basePromotionId: '', basePromotionName: '', baseBudgetId: '', baseBudgetName: '',
  customerId: '', customerName: '', productId: '', productName: '',
  category: '', brand: '', channel: '', region: '',
  startDate: '', endDate: '',
  baselineRevenue: 0, baselineUnits: 0, baselineMarginPct: 25,
  projectedSpend: 0, riskLevel: 'medium', notes: '',
};

const ScenarioPlanningManagement = () => {
  const [tab, setTab] = useState(0);
  const [scenarios, setScenarios] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [scenarioDialog, setScenarioDialog] = useState(false);
  const [scenarioForm, setScenarioForm] = useState(EMPTY_SCENARIO);
  const [editingId, setEditingId] = useState(null);

  const [detailDialog, setDetailDialog] = useState(false);
  const [detailScenario, setDetailScenario] = useState(null);
  const [detailVariables, setDetailVariables] = useState([]);
  const [detailResults, setDetailResults] = useState([]);

  const [varDialog, setVarDialog] = useState(false);
  const [varForm, setVarForm] = useState({ variableName: '', category: 'promotion', baseValue: 0, adjustedValue: 0, unit: '', minValue: 0, maxValue: 100 });
  const [editingVarId, setEditingVarId] = useState(null);
  const [activeScenarioId, setActiveScenarioId] = useState(null);

  const [compareDialog, setCompareDialog] = useState(false);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareData, setCompareData] = useState(null);

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scenarioService.getAll();
      setScenarios(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load scenarios', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await scenarioService.getSummary();
      setSummary(res.data || null);
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [optRes, custRes, prodRes, promoRes, budRes] = await Promise.all([
        scenarioService.getOptions(),
        customerService.getAll({ limit: 500 }),
        productService.getAll({ limit: 500 }),
        promotionService.getAll({ limit: 500 }),
        budgetService.getAll({ limit: 500 }),
      ]);
      setOptions(optRes.data || null);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPromotions(promoRes.data || []);
      setBudgets(budRes.data || []);
    } catch (e) {
      console.error('Ref data fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
    fetchSummary();
    fetchRefData();
  }, [fetchScenarios, fetchSummary, fetchRefData]);

  const handleCreate = () => {
    setScenarioForm(EMPTY_SCENARIO);
    setEditingId(null);
    setScenarioDialog(true);
  };

  const handleEdit = (s) => {
    setScenarioForm({
      name: s.name || '',
      description: s.description || '',
      scenarioType: s.scenarioType || s.scenario_type || 'promotion',
      status: s.status || 'draft',
      basePromotionId: s.basePromotionId || s.base_promotion_id || '',
      basePromotionName: s.basePromotionName || s.base_promotion_name || '',
      baseBudgetId: s.baseBudgetId || s.base_budget_id || '',
      baseBudgetName: s.baseBudgetName || s.base_budget_name || '',
      customerId: s.customerId || s.customer_id || '',
      customerName: s.customerName || s.customer_name || '',
      productId: s.productId || s.product_id || '',
      productName: s.productName || s.product_name || '',
      category: s.category || '',
      brand: s.brand || '',
      channel: s.channel || '',
      region: s.region || '',
      startDate: (s.startDate || s.start_date || '').split('T')[0],
      endDate: (s.endDate || s.end_date || '').split('T')[0],
      baselineRevenue: s.baselineRevenue || s.baseline_revenue || 0,
      baselineUnits: s.baselineUnits || s.baseline_units || 0,
      baselineMarginPct: s.baselineMarginPct || s.baseline_margin_pct || 25,
      projectedSpend: s.projectedSpend || s.projected_spend || 0,
      riskLevel: s.riskLevel || s.risk_level || 'medium',
      notes: s.notes || '',
    });
    setEditingId(s.id);
    setScenarioDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await scenarioService.update(editingId, scenarioForm);
        showSnack('Scenario updated');
      } else {
        await scenarioService.create(scenarioForm);
        showSnack('Scenario created');
      }
      setScenarioDialog(false);
      fetchScenarios();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scenario and all its variables/results?')) return;
    try {
      await scenarioService.delete(id);
      showSnack('Scenario deleted');
      fetchScenarios();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleViewDetail = async (s) => {
    try {
      const res = await scenarioService.getById(s.id);
      const data = res.data || {};
      setDetailScenario(data);
      setDetailVariables(data.variables || []);
      setDetailResults(data.results || []);
      setActiveScenarioId(s.id);
      setDetailDialog(true);
    } catch (e) {
      showSnack(e.message || 'Failed to load scenario', 'error');
    }
  };

  const handleSimulate = async (id) => {
    try {
      setLoading(true);
      const res = await scenarioService.simulate(id);
      showSnack('Simulation complete');
      const data = res.data || {};
      setDetailScenario(data);
      setDetailVariables(data.variables || []);
      setDetailResults(data.results || []);
      fetchScenarios();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Simulation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (s) => {
    try {
      await scenarioService.update(s.id, { isFavorite: !(s.isFavorite || s.is_favorite) });
      fetchScenarios();
    } catch (e) {
      showSnack(e.message || 'Update failed', 'error');
    }
  };

  const handleAddVariable = () => {
    setVarForm({ variableName: '', category: 'promotion', baseValue: 0, adjustedValue: 0, unit: '', minValue: 0, maxValue: 100 });
    setEditingVarId(null);
    setVarDialog(true);
  };

  const handleEditVariable = (v) => {
    setVarForm({
      variableName: v.variableName || v.variable_name || '',
      category: v.category || 'promotion',
      baseValue: v.baseValue || v.base_value || 0,
      adjustedValue: v.adjustedValue || v.adjusted_value || 0,
      unit: v.unit || '',
      minValue: v.minValue || v.min_value || 0,
      maxValue: v.maxValue || v.max_value || 100,
    });
    setEditingVarId(v.id);
    setVarDialog(true);
  };

  const handleSaveVariable = async () => {
    try {
      if (editingVarId) {
        await scenarioService.updateVariable(activeScenarioId, editingVarId, varForm);
        showSnack('Variable updated');
      } else {
        await scenarioService.addVariable(activeScenarioId, varForm);
        showSnack('Variable added');
      }
      setVarDialog(false);
      const res = await scenarioService.getById(activeScenarioId);
      const data = res.data || {};
      setDetailScenario(data);
      setDetailVariables(data.variables || []);
      setDetailResults(data.results || []);
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDeleteVariable = async (varId) => {
    try {
      await scenarioService.deleteVariable(activeScenarioId, varId);
      showSnack('Variable deleted');
      const res = await scenarioService.getById(activeScenarioId);
      const data = res.data || {};
      setDetailVariables(data.variables || []);
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleSliderChange = async (v, newValue) => {
    try {
      await scenarioService.updateVariable(activeScenarioId, v.id, { adjustedValue: newValue });
      const res = await scenarioService.getById(activeScenarioId);
      const data = res.data || {};
      setDetailVariables(data.variables || []);
    } catch (e) {
      console.error('Slider update error:', e);
    }
  };

  const handleCompare = async () => {
    if (!compareA || !compareB) { showSnack('Select two scenarios to compare', 'warning'); return; }
    try {
      const res = await scenarioService.compare(compareA, compareB);
      setCompareData(res.data || null);
    } catch (e) {
      showSnack(e.message || 'Comparison failed', 'error');
    }
  };

  const handleCustomerSelect = (id) => {
    const c = customers.find(x => x.id === id);
    setScenarioForm(prev => ({ ...prev, customerId: id, customerName: c?.name || '' }));
  };

  const handleProductSelect = (id) => {
    const p = products.find(x => x.id === id);
    setScenarioForm(prev => ({ ...prev, productId: id, productName: p?.name || '' }));
  };

  const handlePromotionSelect = (id) => {
    const p = promotions.find(x => x.id === id);
    setScenarioForm(prev => ({ ...prev, basePromotionId: id, basePromotionName: p?.name || '' }));
  };

  const handleBudgetSelect = (id) => {
    const b = budgets.find(x => x.id === id);
    setScenarioForm(prev => ({ ...prev, baseBudgetId: id, baseBudgetName: b?.name || '' }));
  };

  const scenarioTypes = options?.scenarioTypes || [];
  const riskLevels = options?.riskLevels || [];
  const variableCategories = options?.variableCategories || [];
  const commonVariables = options?.commonVariables || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Scenario Planning & What-If Simulator
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Model trade scenarios, adjust variables, simulate outcomes, and compare alternatives
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchScenarios(); fetchSummary(); }}
            sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<CompareIcon />} onClick={() => setCompareDialog(true)}
            sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Compare
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            New Scenario
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Total Scenarios" value={summary?.total || 0}
            subtitle={`${summary?.simulatedCount || 0} simulated`}
            icon={<ScienceIcon />} color="#7C3AED" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Avg ROI" value={formatPct(summary?.avgRoi)}
            subtitle={`Avg lift: ${formatPct(summary?.avgLift)}`}
            icon={<TrendUpIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Projected Revenue" value={formatCurrency(summary?.totalProjectedRevenue)}
            subtitle={`Spend: ${formatCurrency(summary?.totalProjectedSpend)}`}
            icon={<TrendUpIcon />} color="#2563EB" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Net Profit" value={formatCurrency(summary?.totalNetProfit)}
            subtitle={`Confidence: ${formatPct(summary?.avgConfidence)}`}
            icon={<TrendDownIcon />} color="#D97706" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
        <Tab label={`All Scenarios (${scenarios.length})`} />
        <Tab label="Favorites" />
      </Tabs>

      {/* SCENARIO LIST */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280', width: 40 }}></TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Scenario</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Projected Revenue</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">ROI</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Lift %</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Risk</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tab === 1 ? scenarios.filter(s => s.isFavorite || s.is_favorite) : scenarios).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                  {tab === 1 ? 'No favorite scenarios yet' : 'No scenarios yet. Click "New Scenario" to create one.'}
                </TableCell>
              </TableRow>
            ) : (tab === 1 ? scenarios.filter(s => s.isFavorite || s.is_favorite) : scenarios).map((s) => {
              const typeInfo = scenarioTypes.find(t => t.value === (s.scenarioType || s.scenario_type));
              const risk = riskColor(s.riskLevel || s.risk_level);
              const stat = statusColor(s.status);
              const isFav = s.isFavorite || s.is_favorite;
              return (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleToggleFavorite(s)}>
                      {isFav ? <StarIcon sx={{ color: '#F59E0B', fontSize: 18 }} /> : <StarBorderIcon sx={{ color: '#D1D5DB', fontSize: 18 }} />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                    {(s.customerName || s.customer_name) && (
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{s.customerName || s.customer_name}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={typeInfo?.label || (s.scenarioType || s.scenario_type)} size="small"
                      sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 500, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small"
                      sx={{ bgcolor: stat.bg, color: stat.text, fontWeight: 600, fontSize: '0.75rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(s.projectedRevenue || s.projected_revenue)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: (s.projectedRoi || s.projected_roi || 0) > 0 ? '#059669' : '#DC2626' }}>
                      {formatPct(s.projectedRoi || s.projected_roi)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: (s.projectedLiftPct || s.projected_lift_pct || 0) > 0 ? '#059669' : '#DC2626' }}>
                      {formatPct(s.projectedLiftPct || s.projected_lift_pct)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.riskLevel || s.risk_level || 'medium'} size="small"
                      sx={{ bgcolor: risk.bg, color: risk.text, fontWeight: 600, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View & Simulate"><IconButton size="small" onClick={() => handleViewDetail(s)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* SCENARIO CREATE/EDIT DIALOG */}
      <Dialog open={scenarioDialog} onClose={() => setScenarioDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit Scenario' : 'New Scenario'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth size="small" label="Scenario Name" required
                value={scenarioForm.name} onChange={(e) => setScenarioForm(p => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Scenario Type"
                value={scenarioForm.scenarioType} onChange={(e) => setScenarioForm(p => ({ ...p, scenarioType: e.target.value }))}>
                {scenarioTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2}
                value={scenarioForm.description} onChange={(e) => setScenarioForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Customer"
                value={scenarioForm.customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Product"
                value={scenarioForm.productId} onChange={(e) => handleProductSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Base Promotion"
                value={scenarioForm.basePromotionId} onChange={(e) => handlePromotionSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {promotions.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Base Budget"
                value={scenarioForm.baseBudgetId} onChange={(e) => handleBudgetSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {budgets.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Start Date" type="date" InputLabelProps={{ shrink: true }}
                value={scenarioForm.startDate} onChange={(e) => setScenarioForm(p => ({ ...p, startDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="End Date" type="date" InputLabelProps={{ shrink: true }}
                value={scenarioForm.endDate} onChange={(e) => setScenarioForm(p => ({ ...p, endDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Channel"
                value={scenarioForm.channel} onChange={(e) => setScenarioForm(p => ({ ...p, channel: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Risk Level"
                value={scenarioForm.riskLevel} onChange={(e) => setScenarioForm(p => ({ ...p, riskLevel: e.target.value }))}>
                {riskLevels.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>Baseline Assumptions</Typography></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Baseline Revenue (R)" type="number"
                value={scenarioForm.baselineRevenue} onChange={(e) => setScenarioForm(p => ({ ...p, baselineRevenue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Baseline Units" type="number"
                value={scenarioForm.baselineUnits} onChange={(e) => setScenarioForm(p => ({ ...p, baselineUnits: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Baseline Margin %" type="number"
                value={scenarioForm.baselineMarginPct} onChange={(e) => setScenarioForm(p => ({ ...p, baselineMarginPct: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Projected Spend (R)" type="number"
                value={scenarioForm.projectedSpend} onChange={(e) => setScenarioForm(p => ({ ...p, projectedSpend: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={scenarioForm.notes} onChange={(e) => setScenarioForm(p => ({ ...p, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setScenarioDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!scenarioForm.name}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DETAIL / SIMULATOR DIALOG */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {detailScenario?.name || 'Scenario Details'}
            {detailScenario?.status && (
              <Chip label={detailScenario.status} size="small" sx={{ ml: 1, ...(() => { const s = statusColor(detailScenario.status); return { bgcolor: s.bg, color: s.text }; })(), fontWeight: 600 }} />
            )}
          </Box>
          <Button variant="contained" startIcon={<SimulateIcon />} onClick={() => handleSimulate(activeScenarioId)}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Run Simulation
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {detailScenario && (
            <Box>
              {detailScenario.recommendation && (
                <Alert severity={detailScenario.projectedRoi > 100 ? 'success' : detailScenario.projectedRoi > 0 ? 'info' : 'warning'} sx={{ mb: 2, borderRadius: 2 }}>
                  {detailScenario.recommendation}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Projected Revenue</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(detailScenario.projectedRevenue || detailScenario.projected_revenue)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>ROI</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: (detailScenario.projectedRoi || detailScenario.projected_roi || 0) > 0 ? '#059669' : '#DC2626' }}>
                    {formatPct(detailScenario.projectedRoi || detailScenario.projected_roi)}
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Lift %</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatPct(detailScenario.projectedLiftPct || detailScenario.projected_lift_pct)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Net Profit</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(detailScenario.projectedNetProfit || detailScenario.projected_net_profit)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Confidence</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{formatPct(detailScenario.confidenceScore || detailScenario.confidence_score)}</Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Risk</Typography>
                  <Chip label={detailScenario.riskLevel || detailScenario.risk_level || 'medium'} size="small"
                    sx={{ ...(() => { const r = riskColor(detailScenario.riskLevel || detailScenario.risk_level); return { bgcolor: r.bg, color: r.text }; })(), fontWeight: 600 }} />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Variables ({detailVariables.length})</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddVariable} sx={{ color: '#7C3AED' }}>Add Variable</Button>
              </Box>

              {detailVariables.length === 0 ? (
                <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#F9FAFB', mb: 2 }}>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>No variables defined yet</Typography>
                  <Typography variant="caption" color="text.secondary">Add variables to model what-if changes, then run the simulation</Typography>
                </Card>
              ) : (
                <Box sx={{ mb: 2 }}>
                  {detailVariables.map((v) => {
                    const base = v.baseValue || v.base_value || 0;
                    const adj = v.adjustedValue || v.adjusted_value || 0;
                    const change = v.changePct || v.change_pct || 0;
                    const minV = v.minValue || v.min_value || 0;
                    const maxV = v.maxValue || v.max_value || base * 2 || 100;
                    return (
                      <Card key={v.id} sx={{ p: 2, mb: 1, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.variableName || v.variable_name}</Typography>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{v.category} {v.unit ? `(${v.unit})` : ''}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={`${change >= 0 ? '+' : ''}${change.toFixed(1)}%`} size="small"
                              sx={{ bgcolor: change > 0 ? '#D1FAE5' : change < 0 ? '#FEE2E2' : '#F3F4F6', color: change > 0 ? '#059669' : change < 0 ? '#DC2626' : '#6B7280', fontWeight: 600, fontSize: '0.7rem' }} />
                            <IconButton size="small" onClick={() => handleEditVariable(v)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteVariable(v.id)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption" sx={{ minWidth: 60 }}>Base: {base}</Typography>
                          <Slider
                            value={adj} min={minV} max={maxV}
                            step={v.stepSize || v.step_size || 1}
                            onChange={(_, val) => handleSliderChange(v, val)}
                            sx={{ color: '#7C3AED', flex: 1 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{adj}</Typography>
                        </Box>
                        {(v.impactOnRevenue || v.impact_on_revenue) ? (
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            Revenue impact: {formatCurrency(v.impactOnRevenue || v.impact_on_revenue)} | Units impact: {formatNumber(v.impactOnUnits || v.impact_on_units)}
                          </Typography>
                        ) : null}
                      </Card>
                    );
                  })}
                </Box>
              )}

              {detailResults.length > 0 && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Simulation Results</Typography>
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Metric</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Baseline</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Projected</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Variance</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Variance %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailResults.map((r) => {
                          const variance = r.variance || 0;
                          return (
                            <TableRow key={r.id} hover>
                              <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{r.metricName || r.metric_name}</Typography></TableCell>
                              <TableCell align="right">{formatCurrency(r.baselineValue || r.baseline_value)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(r.metricValue || r.metric_value)}</TableCell>
                              <TableCell align="right" sx={{ color: variance > 0 ? '#059669' : variance < 0 ? '#DC2626' : '#6B7280' }}>
                                {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                              </TableCell>
                              <TableCell align="right" sx={{ color: (r.variancePct || r.variance_pct || 0) > 0 ? '#059669' : '#DC2626' }}>
                                {(r.variancePct || r.variance_pct || 0) > 0 ? '+' : ''}{formatPct(r.variancePct || r.variance_pct)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="outlined" onClick={() => { setDetailDialog(false); handleEdit(detailScenario); }}
            sx={{ borderColor: '#7C3AED', color: '#7C3AED' }}>
            Edit Scenario
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD/EDIT VARIABLE DIALOG */}
      <Dialog open={varDialog} onClose={() => setVarDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingVarId ? 'Edit Variable' : 'Add Variable'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Variable Name" required
                value={varForm.variableName} onChange={(e) => setVarForm(p => ({ ...p, variableName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Category"
                value={varForm.category} onChange={(e) => setVarForm(p => ({ ...p, category: e.target.value }))}>
                {variableCategories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Unit" placeholder="e.g. R, %, units"
                value={varForm.unit} onChange={(e) => setVarForm(p => ({ ...p, unit: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Base Value" type="number"
                value={varForm.baseValue} onChange={(e) => setVarForm(p => ({ ...p, baseValue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Adjusted Value" type="number"
                value={varForm.adjustedValue} onChange={(e) => setVarForm(p => ({ ...p, adjustedValue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Min Value" type="number"
                value={varForm.minValue} onChange={(e) => setVarForm(p => ({ ...p, minValue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Max Value" type="number"
                value={varForm.maxValue} onChange={(e) => setVarForm(p => ({ ...p, maxValue: parseFloat(e.target.value) || 0 }))} />
            </Grid>

            {commonVariables.length > 0 && !editingVarId && (
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#6B7280', mb: 1, display: 'block' }}>Quick add from common variables:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {commonVariables.map((cv, i) => (
                    <Chip key={i} label={cv.name} size="small" clickable
                      onClick={() => setVarForm({ variableName: cv.name, category: cv.category, unit: cv.unit, baseValue: cv.defaultBase, adjustedValue: cv.defaultBase, minValue: cv.min, maxValue: cv.max })}
                      sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontSize: '0.7rem' }} />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVarDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVariable} disabled={!varForm.variableName}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingVarId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* COMPARE DIALOG */}
      <Dialog open={compareDialog} onClose={() => { setCompareDialog(false); setCompareData(null); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Compare Scenarios</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Scenario A"
                value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                {scenarios.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Scenario B"
                value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                {scenarios.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleCompare} disabled={!compareA || !compareB}
                sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                Compare
              </Button>
            </Grid>
          </Grid>

          {compareData && (
            <Box>
              <Grid container spacing={2}>
                {[
                  { label: 'Revenue', a: compareData.scenarioA?.projectedRevenue || compareData.scenarioA?.projected_revenue, b: compareData.scenarioB?.projectedRevenue || compareData.scenarioB?.projected_revenue, diff: compareData.comparison?.revenueVariance, fmt: formatCurrency },
                  { label: 'ROI', a: compareData.scenarioA?.projectedRoi || compareData.scenarioA?.projected_roi, b: compareData.scenarioB?.projectedRoi || compareData.scenarioB?.projected_roi, diff: compareData.comparison?.roiVariance, fmt: formatPct },
                  { label: 'Trade Spend', a: compareData.scenarioA?.projectedSpend || compareData.scenarioA?.projected_spend, b: compareData.scenarioB?.projectedSpend || compareData.scenarioB?.projected_spend, diff: compareData.comparison?.spendVariance, fmt: formatCurrency },
                  { label: 'Lift %', a: compareData.scenarioA?.projectedLiftPct || compareData.scenarioA?.projected_lift_pct, b: compareData.scenarioB?.projectedLiftPct || compareData.scenarioB?.projected_lift_pct, diff: compareData.comparison?.liftVariance, fmt: formatPct },
                  { label: 'Net Profit', a: compareData.scenarioA?.projectedNetProfit || compareData.scenarioA?.projected_net_profit, b: compareData.scenarioB?.projectedNetProfit || compareData.scenarioB?.projected_net_profit, diff: compareData.comparison?.profitVariance, fmt: formatCurrency },
                ].map((m, i) => (
                  <Grid item xs={12} key={i}>
                    <Card sx={{ p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                      <Grid container alignItems="center">
                        <Grid item xs={3}><Typography variant="body2" sx={{ fontWeight: 600 }}>{m.label}</Typography></Grid>
                        <Grid item xs={3} sx={{ textAlign: 'center' }}><Typography variant="body2">{m.fmt(m.a)}</Typography></Grid>
                        <Grid item xs={3} sx={{ textAlign: 'center' }}><Typography variant="body2">{m.fmt(m.b)}</Typography></Grid>
                        <Grid item xs={3} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: (m.diff || 0) > 0 ? '#059669' : (m.diff || 0) < 0 ? '#DC2626' : '#6B7280' }}>
                            {(m.diff || 0) > 0 ? '+' : ''}{m.fmt(m.diff)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setCompareDialog(false); setCompareData(null); }}>Close</Button>
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

export default ScenarioPlanningManagement;
