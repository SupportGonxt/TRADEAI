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
  AttachMoney as PriceIcon, TrendingUp as MarginIcon,
  Lightbulb as RecommendIcon,
  Assessment as AnalysisIcon
} from '@mui/icons-material';
import { pricingMarginService } from '../../services/api';

const statusColors = {
  draft: 'default', active: 'success', expired: 'error', archived: 'default',
  pending: 'warning', approved: 'success', rejected: 'error', applied: 'info'
};

const PricingMarginOptimization = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [models, setModels] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('model');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const loadSummary = useCallback(async () => {
    try {
      const res = await pricingMarginService.getSummary();
      if (res.success) setSummary(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const res = await pricingMarginService.getOptions();
      if (res.success) setOptions(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      const res = await pricingMarginService.getModels(params);
      if (res.success) { setModels(res.data || []); setTotal(res.total || 0); }
    } catch (e) { showSnack('Failed to load pricing models', 'error'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pricingMarginService.getAnalyses({ limit: 100 });
      if (res.success) setAnalyses(res.data || []);
    } catch (e) { showSnack('Failed to load analyses', 'error'); }
    setLoading(false);
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pricingMarginService.getRecommendations({ limit: 100 });
      if (res.success) setRecommendations(res.data || []);
    } catch (e) { showSnack('Failed to load recommendations', 'error'); }
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (modelId) => {
    setLoading(true);
    try {
      const res = await pricingMarginService.getModelById(modelId);
      if (res.success) setDetail(res.data);
    } catch (e) { showSnack('Failed to load model details', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => {
    if (!id) {
      if (tab === 0) loadModels();
      else if (tab === 1) loadAnalyses();
      else if (tab === 2) loadRecommendations();
    }
  }, [id, tab, loadModels, loadAnalyses, loadRecommendations]);
  useEffect(() => { if (id) loadDetail(id); }, [id, loadDetail]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setForm(type === 'model' ? { name: '', modelType: 'cost_plus', status: 'draft', currency: 'ZAR' } :
      type === 'analysis' ? { name: '', analysisType: 'product_margin', dimension: 'product' } :
      { recommendationType: 'price_increase', priority: 'medium', status: 'pending' });
    setDialogOpen(true);
  };

  const handleEdit = (item) => {
    setDialogType('model');
    setEditItem(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'model') {
        if (editItem) {
          await pricingMarginService.updateModel(editItem.id, form);
          showSnack('Pricing model updated');
        } else {
          await pricingMarginService.createModel(form);
          showSnack('Pricing model created');
        }
        loadModels();
        if (id) loadDetail(id);
      } else if (dialogType === 'analysis') {
        await pricingMarginService.createAnalysis(form);
        showSnack('Margin analysis created');
        loadAnalyses();
      } else if (dialogType === 'recommendation') {
        await pricingMarginService.createRecommendation(form);
        showSnack('Recommendation created');
        loadRecommendations();
      }
      loadSummary();
      setDialogOpen(false);
    } catch (e) { showSnack('Save failed: ' + (e.response?.data?.message || e.message), 'error'); }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'model') { await pricingMarginService.deleteModel(itemId); showSnack('Model deleted'); loadModels(); }
      else if (type === 'analysis') { await pricingMarginService.deleteAnalysis(itemId); showSnack('Analysis deleted'); loadAnalyses(); }
      else if (type === 'recommendation') { await pricingMarginService.deleteRecommendation(itemId); showSnack('Recommendation deleted'); loadRecommendations(); }
      loadSummary();
      if (id) loadDetail(id);
    } catch (e) { showSnack('Delete failed', 'error'); }
  };

  const formatCurrency = (val) => val ? `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00';
  const formatPct = (val) => val ? `${Number(val).toFixed(1)}%` : '0.0%';

  if (id && detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/pricing-margin')}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{detail.name}</Typography>
            <Typography variant="body2" color="text.secondary">{detail.modelType} | {detail.channel || 'All Channels'}</Typography>
          </Box>
          <Chip label={detail.status} color={statusColors[detail.status] || 'default'} />
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(detail)}>Edit</Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Current Price</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(detail.currentPrice)}</Typography>
              <Typography variant="caption" color="text.secondary">List: {formatCurrency(detail.listPrice)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Recommended Price</Typography>
              <Typography variant="h6" fontWeight={700} color={detail.recommendedPrice > detail.currentPrice ? 'success.main' : 'error.main'}>{formatCurrency(detail.recommendedPrice)}</Typography>
              <Typography variant="caption" color="text.secondary">Floor: {formatCurrency(detail.floorPrice)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Target Margin</Typography>
              <Typography variant="h6" fontWeight={700}>{formatPct(detail.targetMarginPct)}</Typography>
              <Typography variant="caption" color="text.secondary">Base cost: {formatCurrency(detail.baseCost)}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">Optimization Score</Typography>
              <Typography variant="h6" fontWeight={700}>{formatPct(detail.optimizationScore)}</Typography>
              <Typography variant="caption" color="text.secondary">Confidence: {formatPct(detail.confidenceScore)}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Product</Typography><Typography>{detail.productName || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Customer</Typography><Typography>{detail.customerName || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Elasticity</Typography><Typography>{detail.priceElasticity || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Competitor Avg</Typography><Typography>{formatCurrency(detail.competitorAvgPrice)}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Market Position</Typography><Chip label={detail.marketPosition || 'parity'} size="small" /></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Effective Date</Typography><Typography>{detail.effectiveDate || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">End Date</Typography><Typography>{detail.endDate || '—'}</Typography></Grid>
            <Grid item xs={6} md={3}><Typography variant="body2" color="text.secondary">Owner</Typography><Typography>{detail.owner || '—'}</Typography></Grid>
          </Grid>
        </Paper>

        <Typography variant="h6" sx={{ mb: 2 }}>Price Waterfall ({detail.waterfall?.length || 0} steps)</Typography>
        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>#</TableCell><TableCell>Step</TableCell><TableCell>Type</TableCell>
                <TableCell align="right">Amount</TableCell><TableCell align="right">% of List</TableCell>
                <TableCell align="right">Running Total</TableCell><TableCell align="right">Margin %</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(detail.waterfall || []).map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.stepOrder}</TableCell>
                    <TableCell>{w.stepName}</TableCell>
                    <TableCell><Chip label={w.stepType} size="small" variant="outlined" /></TableCell>
                    <TableCell align="right">{formatCurrency(w.amount)}</TableCell>
                    <TableCell align="right">{formatPct(w.pctOfList)}</TableCell>
                    <TableCell align="right">{formatCurrency(w.runningTotal)}</TableCell>
                    <TableCell align="right">{formatPct(w.runningMarginPct)}</TableCell>
                    <TableCell><IconButton size="small" onClick={() => handleDelete('waterfall', w.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {(!detail.waterfall || detail.waterfall.length === 0) && <TableRow><TableCell colSpan={8} align="center">No waterfall steps</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Typography variant="h6" sx={{ mb: 2 }}>Recommendations ({detail.recommendations?.length || 0})</Typography>
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Type</TableCell><TableCell>Product</TableCell><TableCell>Current</TableCell>
                <TableCell>Recommended</TableCell><TableCell>Change</TableCell><TableCell>Revenue Impact</TableCell>
                <TableCell>Confidence</TableCell><TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(detail.recommendations || []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Chip label={r.recommendationType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{r.productName || '—'}</TableCell>
                    <TableCell>{formatCurrency(r.currentPrice)}</TableCell>
                    <TableCell>{formatCurrency(r.recommendedPrice)}</TableCell>
                    <TableCell><Typography color={r.priceChangePct > 0 ? 'success.main' : 'error.main'}>{formatPct(r.priceChangePct)}</Typography></TableCell>
                    <TableCell>{formatCurrency(r.revenueImpact)}</TableCell>
                    <TableCell>{formatPct(r.confidenceScore)}</TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell>
                  </TableRow>
                ))}
                {(!detail.recommendations || detail.recommendations.length === 0) && <TableRow><TableCell colSpan={8} align="center">No recommendations</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

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
          <Typography variant="h4" fontWeight={800}>Pricing & Margin Optimization</Typography>
          <Typography variant="body2" color="text.secondary">Pricing models, margin analysis, price waterfall, and AI recommendations</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => { loadSummary(); if (tab === 0) loadModels(); else if (tab === 1) loadAnalyses(); else loadRecommendations(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate(tab === 0 ? 'model' : tab === 1 ? 'analysis' : 'recommendation')}>
            New {tab === 0 ? 'Pricing Model' : tab === 1 ? 'Analysis' : 'Recommendation'}
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#F5F3FF', border: '1px solid #E9D5FF' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><PriceIcon sx={{ color: '#7C3AED' }} /><Typography variant="body2" color="text.secondary">Pricing Models</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{summary.models?.total || 0}</Typography>
              <Typography variant="body2" color="text.secondary">{summary.models?.active || 0} active</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><MarginIcon sx={{ color: '#059669' }} /><Typography variant="body2" color="text.secondary">Avg Gross Margin</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{formatPct(summary.avgGrossMargin)}</Typography>
              <Typography variant="body2" color="text.secondary">across analyses</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><AnalysisIcon sx={{ color: '#2563EB' }} /><Typography variant="body2" color="text.secondary">Margin Analyses</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{summary.analyses || 0}</Typography>
              <Typography variant="body2" color="text.secondary">completed</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><RecommendIcon sx={{ color: '#D97706' }} /><Typography variant="body2" color="text.secondary">Pending Actions</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{summary.pendingRecommendations || 0}</Typography>
              <Typography variant="body2" color="text.secondary">recommendations</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}><CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><PriceIcon sx={{ color: '#DC2626' }} /><Typography variant="body2" color="text.secondary">Revenue Impact</Typography></Box>
              <Typography variant="h4" fontWeight={700}>{formatCurrency(summary.totalRevenueImpact)}</Typography>
              <Typography variant="body2" color="text.secondary">from pending recs</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Pricing Models" icon={<PriceIcon />} iconPosition="start" />
        <Tab label="Margin Analyses" icon={<AnalysisIcon />} iconPosition="start" />
        <Tab label="Recommendations" icon={<RecommendIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField placeholder="Search models..." size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: 300 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Box>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead><TableRow>
                <TableCell>Model</TableCell><TableCell>Type</TableCell><TableCell>Product</TableCell>
                <TableCell>Current Price</TableCell><TableCell>Recommended</TableCell><TableCell>Target Margin</TableCell>
                <TableCell>Score</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/pricing-margin/${m.id}`)}>
                    <TableCell><Typography fontWeight={600}>{m.name}</Typography></TableCell>
                    <TableCell><Chip label={m.modelType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{m.productName || '—'}</TableCell>
                    <TableCell>{formatCurrency(m.currentPrice)}</TableCell>
                    <TableCell><Typography color={m.recommendedPrice > m.currentPrice ? 'success.main' : 'text.primary'}>{formatCurrency(m.recommendedPrice)}</Typography></TableCell>
                    <TableCell>{formatPct(m.targetMarginPct)}</TableCell>
                    <TableCell>{formatPct(m.optimizationScore)}</TableCell>
                    <TableCell><Chip label={m.status} size="small" color={statusColors[m.status] || 'default'} /></TableCell>
                    <TableCell>
                      <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(m); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('model', m.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No pricing models found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </Paper>
      )}

      {tab === 1 && (
        <Paper>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead><TableRow>
                <TableCell>Analysis</TableCell><TableCell>Type</TableCell><TableCell>Dimension</TableCell>
                <TableCell>Gross Sales</TableCell><TableCell>Net Sales</TableCell><TableCell>Gross Margin</TableCell>
                <TableCell>Net Margin</TableCell><TableCell>Trend</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {analyses.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell><Typography fontWeight={600}>{a.name}</Typography></TableCell>
                    <TableCell><Chip label={a.analysisType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{a.dimension}</TableCell>
                    <TableCell>{formatCurrency(a.grossSales)}</TableCell>
                    <TableCell>{formatCurrency(a.netSales)}</TableCell>
                    <TableCell>{formatPct(a.grossMarginPct)}</TableCell>
                    <TableCell>{formatPct(a.netMarginPct)}</TableCell>
                    <TableCell><Chip label={a.marginTrend || 'stable'} size="small" color={a.marginTrend === 'improving' ? 'success' : a.marginTrend === 'declining' ? 'error' : 'default'} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => handleDelete('analysis', a.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {analyses.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No margin analyses found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 2 && (
        <Paper>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead><TableRow>
                <TableCell>Type</TableCell><TableCell>Product</TableCell><TableCell>Customer</TableCell>
                <TableCell>Current Price</TableCell><TableCell>Recommended</TableCell><TableCell>Change</TableCell>
                <TableCell>Revenue Impact</TableCell><TableCell>Confidence</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {recommendations.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell><Chip label={r.recommendationType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{r.productName || '—'}</TableCell>
                    <TableCell>{r.customerName || '—'}</TableCell>
                    <TableCell>{formatCurrency(r.currentPrice)}</TableCell>
                    <TableCell>{formatCurrency(r.recommendedPrice)}</TableCell>
                    <TableCell><Typography color={r.priceChangePct > 0 ? 'success.main' : 'error.main'}>{formatPct(r.priceChangePct)}</Typography></TableCell>
                    <TableCell>{formatCurrency(r.revenueImpact)}</TableCell>
                    <TableCell>{formatPct(r.confidenceScore)}</TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => handleDelete('recommendation', r.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {recommendations.length === 0 && !loading && <TableRow><TableCell colSpan={10} align="center">No recommendations found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'New'} {dialogType === 'model' ? 'Pricing Model' : dialogType === 'analysis' ? 'Margin Analysis' : 'Recommendation'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {dialogType === 'model' && (
              <>
                <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
                <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
                <TextField label="Model Type" select value={form.modelType || 'cost_plus'} onChange={(e) => setForm({ ...form, modelType: e.target.value })} fullWidth>
                  {(options?.modelTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Product Name" value={form.productName || ''} onChange={(e) => setForm({ ...form, productName: e.target.value })} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Customer Name" value={form.customerName || ''} onChange={(e) => setForm({ ...form, customerName: e.target.value })} fullWidth /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={4}><TextField label="Base Cost" type="number" value={form.baseCost || ''} onChange={(e) => setForm({ ...form, baseCost: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={4}><TextField label="List Price" type="number" value={form.listPrice || ''} onChange={(e) => setForm({ ...form, listPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={4}><TextField label="Current Price" type="number" value={form.currentPrice || ''} onChange={(e) => setForm({ ...form, currentPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={4}><TextField label="Floor Price" type="number" value={form.floorPrice || ''} onChange={(e) => setForm({ ...form, floorPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={4}><TextField label="Target Margin %" type="number" value={form.targetMarginPct || ''} onChange={(e) => setForm({ ...form, targetMarginPct: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={4}><TextField label="Competitor Avg" type="number" value={form.competitorAvgPrice || ''} onChange={(e) => setForm({ ...form, competitorAvgPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Effective Date" type="date" value={form.effectiveDate || ''} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                  <Grid item xs={6}><TextField label="Owner" value={form.owner || ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} fullWidth /></Grid>
                </Grid>
              </>
            )}
            {dialogType === 'analysis' && (
              <>
                <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
                <TextField label="Analysis Type" select value={form.analysisType || 'product_margin'} onChange={(e) => setForm({ ...form, analysisType: e.target.value })} fullWidth>
                  {(options?.analysisTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Period Start" type="date" value={form.periodStart || ''} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                  <Grid item xs={6}><TextField label="Period End" type="date" value={form.periodEnd || ''} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={4}><TextField label="Gross Sales" type="number" value={form.grossSales || ''} onChange={(e) => setForm({ ...form, grossSales: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={4}><TextField label="Trade Spend" type="number" value={form.tradeSpend || ''} onChange={(e) => setForm({ ...form, tradeSpend: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={4}><TextField label="COGS" type="number" value={form.cogs || ''} onChange={(e) => setForm({ ...form, cogs: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                </Grid>
                <TextField label="Target Margin %" type="number" value={form.targetMarginPct || ''} onChange={(e) => setForm({ ...form, targetMarginPct: parseFloat(e.target.value) || 0 })} fullWidth />
              </>
            )}
            {dialogType === 'recommendation' && (
              <>
                <TextField label="Type" select value={form.recommendationType || 'price_increase'} onChange={(e) => setForm({ ...form, recommendationType: e.target.value })} fullWidth>
                  {(options?.recommendationTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Product Name" value={form.productName || ''} onChange={(e) => setForm({ ...form, productName: e.target.value })} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Customer Name" value={form.customerName || ''} onChange={(e) => setForm({ ...form, customerName: e.target.value })} fullWidth /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Current Price" type="number" value={form.currentPrice || ''} onChange={(e) => setForm({ ...form, currentPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Recommended Price" type="number" value={form.recommendedPrice || ''} onChange={(e) => setForm({ ...form, recommendedPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Revenue Impact" type="number" value={form.revenueImpact || ''} onChange={(e) => setForm({ ...form, revenueImpact: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Confidence %" type="number" value={form.confidenceScore || ''} onChange={(e) => setForm({ ...form, confidenceScore: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                </Grid>
                <TextField label="Rationale" value={form.rationale || ''} onChange={(e) => setForm({ ...form, rationale: e.target.value })} fullWidth multiline rows={2} />
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
};

export default PricingMarginOptimization;
