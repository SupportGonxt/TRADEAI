import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Chip, MenuItem,
  InputAdornment, LinearProgress, Tooltip, Card, CardContent,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon,
  Delete as DeleteIcon, TrendingUp as GrowthIcon, AttachMoney as PricingIcon,
  PieChart as MixIcon, Timeline as TrackIcon, Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { revenueGrowthService } from '../../services/api';

const formatCurrency = (v) => {
  if (!v && v !== 0) return 'R0';
  if (v >= 1000000) return `R${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R${(v / 1000).toFixed(0)}K`;
  return `R${Number(v).toFixed(2)}`;
};
const formatPct = (v) => `${Number(v || 0).toFixed(1)}%`;

const statusColors = {
  draft: 'default', active: 'success', completed: 'info', paused: 'warning', cancelled: 'error',
};
const priorityColors = {
  critical: 'error', high: 'warning', medium: 'info', low: 'default',
};

const emptyInitiative = {
  name: '', description: '', initiativeType: 'pricing', status: 'draft', priority: 'medium',
  category: 'general', channel: '', region: '', brand: '', startDate: '', endDate: '',
  targetRevenue: 0, targetMarginPct: 0, targetGrowthPct: 0, baselineRevenue: 0,
  investmentAmount: 0, riskLevel: 'low', owner: '', notes: '',
};

const emptyPricing = {
  name: '', description: '', strategyType: 'regular', status: 'draft',
  productName: '', category: '', brand: '', customerName: '', channel: '',
  currentPrice: 0, recommendedPrice: 0, priceChangePct: 0,
  currentMarginPct: 0, projectedMarginPct: 0, priceElasticity: 0,
  volumeImpactPct: 0, revenueImpact: 0, marginImpact: 0,
  competitorPrice: 0, effectiveDate: '', notes: '',
};

export default function RevenueGrowthManagement() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [initiatives, setInitiatives] = useState([]);
  const [selectedInit, setSelectedInit] = useState(null);
  const [initDialog, setInitDialog] = useState(false);
  const [initForm, setInitForm] = useState(emptyInitiative);
  const [editingInit, setEditingInit] = useState(null);

  const [pricing, setPricing] = useState([]);
  const [pricingDialog, setPricingDialog] = useState(false);
  const [pricingForm, setPricingForm] = useState(emptyPricing);
  const [editingPricing, setEditingPricing] = useState(null);

  const [mixAnalyses, setMixAnalyses] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  const loadSummary = useCallback(async () => {
    try { const r = await revenueGrowthService.getSummary(); if (r.success) setSummary(r.data); } catch (e) { console.error(e); }
  }, []);

  const loadOptions = useCallback(async () => {
    try { const r = await revenueGrowthService.getOptions(); if (r.success) setOptions(r.data); } catch (e) { console.error(e); }
  }, []);

  const loadInitiatives = useCallback(async () => {
    setLoading(true);
    try { const r = await revenueGrowthService.getInitiatives({ search, limit: 100 }); if (r.success) setInitiatives(r.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, [search]);

  const loadPricing = useCallback(async () => {
    setLoading(true);
    try { const r = await revenueGrowthService.getPricing({ limit: 100 }); if (r.success) setPricing(r.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadMix = useCallback(async () => {
    setLoading(true);
    try { const r = await revenueGrowthService.getMixAnalyses({ limit: 100 }); if (r.success) setMixAnalyses(r.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const loadGrowth = useCallback(async () => {
    setLoading(true);
    try { const r = await revenueGrowthService.getGrowthTracking({ limit: 100 }); if (r.success) setGrowthData(r.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => {
    if (tab === 0) loadInitiatives();
    else if (tab === 1) loadPricing();
    else if (tab === 2) loadMix();
    else if (tab === 3) loadGrowth();
  }, [tab, loadInitiatives, loadPricing, loadMix, loadGrowth]);

  const handleSaveInitiative = async () => {
    try {
      if (editingInit) await revenueGrowthService.updateInitiative(editingInit, initForm);
      else await revenueGrowthService.createInitiative(initForm);
      setInitDialog(false); setInitForm(emptyInitiative); setEditingInit(null);
      loadInitiatives(); loadSummary();
    } catch (e) { console.error(e); }
  };

  const handleDeleteInitiative = async (id) => {
    if (!window.confirm('Delete this initiative and all associated data?')) return;
    try { await revenueGrowthService.deleteInitiative(id); loadInitiatives(); loadSummary(); } catch (e) { console.error(e); }
  };

  const handleViewInitiative = async (id) => {
    try { const r = await revenueGrowthService.getInitiativeById(id); if (r.success) setSelectedInit(r.data); } catch (e) { console.error(e); }
  };

  const handleEditInitiative = (item) => {
    setInitForm({
      name: item.name || '', description: item.description || '',
      initiativeType: item.initiativeType || item.initiative_type || 'pricing',
      status: item.status || 'draft', priority: item.priority || 'medium',
      category: item.category || 'general', channel: item.channel || '',
      region: item.region || '', brand: item.brand || '',
      startDate: item.startDate || item.start_date || '',
      endDate: item.endDate || item.end_date || '',
      targetRevenue: item.targetRevenue || item.target_revenue || 0,
      targetMarginPct: item.targetMarginPct || item.target_margin_pct || 0,
      targetGrowthPct: item.targetGrowthPct || item.target_growth_pct || 0,
      baselineRevenue: item.baselineRevenue || item.baseline_revenue || 0,
      investmentAmount: item.investmentAmount || item.investment_amount || 0,
      riskLevel: item.riskLevel || item.risk_level || 'low',
      owner: item.owner || '', notes: item.notes || '',
    });
    setEditingInit(item.id); setInitDialog(true);
  };

  const handleSavePricing = async () => {
    try {
      if (editingPricing) await revenueGrowthService.updatePricing(editingPricing, pricingForm);
      else await revenueGrowthService.createPricing(pricingForm);
      setPricingDialog(false); setPricingForm(emptyPricing); setEditingPricing(null);
      loadPricing(); loadSummary();
    } catch (e) { console.error(e); }
  };

  const handleDeletePricing = async (id) => {
    if (!window.confirm('Delete this pricing strategy?')) return;
    try { await revenueGrowthService.deletePricing(id); loadPricing(); loadSummary(); } catch (e) { console.error(e); }
  };

  const handleEditPricing = (item) => {
    setPricingForm({
      name: item.name || '', description: item.description || '',
      strategyType: item.strategyType || item.strategy_type || 'regular',
      status: item.status || 'draft',
      productName: item.productName || item.product_name || '',
      category: item.category || '', brand: item.brand || '',
      customerName: item.customerName || item.customer_name || '',
      channel: item.channel || '',
      currentPrice: item.currentPrice || item.current_price || 0,
      recommendedPrice: item.recommendedPrice || item.recommended_price || 0,
      priceChangePct: item.priceChangePct || item.price_change_pct || 0,
      currentMarginPct: item.currentMarginPct || item.current_margin_pct || 0,
      projectedMarginPct: item.projectedMarginPct || item.projected_margin_pct || 0,
      priceElasticity: item.priceElasticity || item.price_elasticity || 0,
      volumeImpactPct: item.volumeImpactPct || item.volume_impact_pct || 0,
      revenueImpact: item.revenueImpact || item.revenue_impact || 0,
      marginImpact: item.marginImpact || item.margin_impact || 0,
      competitorPrice: item.competitorPrice || item.competitor_price || 0,
      effectiveDate: item.effectiveDate || item.effective_date || '',
      notes: item.notes || '',
    });
    setEditingPricing(item.id); setPricingDialog(true);
  };

  const summaryCards = summary ? [
    { label: 'Initiatives', value: summary.initiatives?.total || 0, sub: `${summary.initiatives?.active || 0} active`, icon: <GrowthIcon /> },
    { label: 'Target Revenue', value: formatCurrency(summary.revenue?.target), sub: `${formatPct(summary.revenue?.achievement)} achieved`, icon: <GrowthIcon /> },
    { label: 'Pricing Strategies', value: summary.pricing?.total || 0, sub: `${summary.pricing?.active || 0} active`, icon: <PricingIcon /> },
    { label: 'Avg ROI', value: formatPct(summary.avgRoi), sub: `${summary.mixAnalyses?.total || 0} mix analyses`, icon: <MixIcon /> },
  ] : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Revenue Growth Management</Typography>
          <Typography variant="body2" color="text.secondary">Strategic pricing, mix optimization, and growth tracking</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadSummary(); if (tab === 0) loadInitiatives(); else if (tab === 1) loadPricing(); else if (tab === 2) loadMix(); else loadGrowth(); }}>Refresh</Button>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryCards.map((card, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F3E8FF', color: '#7C3AED' }}>{card.icon}</Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSelectedInit(null); }} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Initiatives" icon={<GrowthIcon />} iconPosition="start" />
          <Tab label="Pricing Strategies" icon={<PricingIcon />} iconPosition="start" />
          <Tab label="Mix Analysis" icon={<MixIcon />} iconPosition="start" />
          <Tab label="Growth Tracking" icon={<TrackIcon />} iconPosition="start" />
        </Tabs>

        {loading && <LinearProgress />}

        {tab === 0 && !selectedInit && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField size="small" placeholder="Search initiatives..." value={search} onChange={(e) => setSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ flex: 1 }} />
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setInitForm(emptyInitiative); setEditingInit(null); setInitDialog(true); }}>New Initiative</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Target Revenue</TableCell>
                    <TableCell align="right">Actual Revenue</TableCell>
                    <TableCell align="right">ROI</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {initiatives.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No initiatives found</TableCell></TableRow>
                  ) : initiatives.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography></TableCell>
                      <TableCell><Chip label={item.initiativeType || item.initiative_type || '-'} size="small" /></TableCell>
                      <TableCell><Chip label={item.status} size="small" color={statusColors[item.status] || 'default'} /></TableCell>
                      <TableCell><Chip label={item.priority} size="small" color={priorityColors[item.priority] || 'default'} /></TableCell>
                      <TableCell align="right">{formatCurrency(item.targetRevenue || item.target_revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.actualRevenue || item.actual_revenue)}</TableCell>
                      <TableCell align="right">{formatPct(item.roi)}</TableCell>
                      <TableCell><Chip label={item.riskLevel || item.risk_level || 'low'} size="small" color={item.riskLevel === 'high' || item.risk_level === 'high' ? 'error' : item.riskLevel === 'medium' || item.risk_level === 'medium' ? 'warning' : 'success'} /></TableCell>
                      <TableCell align="center">
                        <Tooltip title="View"><IconButton size="small" onClick={() => handleViewInitiative(item.id)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditInitiative(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteInitiative(item.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 0 && selectedInit && (
          <Box sx={{ p: 3 }}>
            <Button variant="text" onClick={() => setSelectedInit(null)} sx={{ mb: 2 }}>&larr; Back to list</Button>
            <Typography variant="h6" fontWeight={700} gutterBottom>{selectedInit.name}</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body2">{selectedInit.initiativeType || selectedInit.initiative_type}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Status</Typography><br /><Chip label={selectedInit.status} size="small" color={statusColors[selectedInit.status] || 'default'} /></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Priority</Typography><br /><Chip label={selectedInit.priority} size="small" color={priorityColors[selectedInit.priority] || 'default'} /></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Risk</Typography><br /><Chip label={selectedInit.riskLevel || selectedInit.risk_level || 'low'} size="small" /></Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Target Revenue</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(selectedInit.targetRevenue || selectedInit.target_revenue)}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Actual Revenue</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(selectedInit.actualRevenue || selectedInit.actual_revenue)}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Investment</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(selectedInit.investmentAmount || selectedInit.investment_amount)}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">ROI</Typography><Typography variant="h6" fontWeight={700}>{formatPct(selectedInit.roi)}</Typography></Grid>
            </Grid>
            {selectedInit.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{selectedInit.description}</Typography>}

            {selectedInit.pricingStrategies?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Pricing Strategies ({selectedInit.pricingStrategies.length})</Typography>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell align="right">Current</TableCell><TableCell align="right">Recommended</TableCell><TableCell align="right">Change</TableCell><TableCell align="right">Revenue Impact</TableCell></TableRow></TableHead><TableBody>
                  {selectedInit.pricingStrategies.map(p => (
                    <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.strategyType || p.strategy_type}</TableCell><TableCell align="right">{formatCurrency(p.currentPrice || p.current_price)}</TableCell><TableCell align="right">{formatCurrency(p.recommendedPrice || p.recommended_price)}</TableCell><TableCell align="right">{formatPct(p.priceChangePct || p.price_change_pct)}</TableCell><TableCell align="right">{formatCurrency(p.revenueImpact || p.revenue_impact)}</TableCell></TableRow>
                  ))}
                </TableBody></Table></TableContainer>
              </Box>
            )}

            {selectedInit.growthTrackers?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Growth Tracking ({selectedInit.growthTrackers.length})</Typography>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Period</TableCell><TableCell>Metric</TableCell><TableCell align="right">Target</TableCell><TableCell align="right">Actual</TableCell><TableCell align="right">Variance</TableCell><TableCell align="right">Growth</TableCell></TableRow></TableHead><TableBody>
                  {selectedInit.growthTrackers.map(g => (
                    <TableRow key={g.id}><TableCell>{g.period}</TableCell><TableCell>{g.metricType || g.metric_type}</TableCell><TableCell align="right">{formatCurrency(g.targetValue || g.target_value)}</TableCell><TableCell align="right">{formatCurrency(g.actualValue || g.actual_value)}</TableCell><TableCell align="right">{formatPct(g.variancePct || g.variance_pct)}</TableCell><TableCell align="right">{formatPct(g.growthPct || g.growth_pct)}</TableCell></TableRow>
                  ))}
                </TableBody></Table></TableContainer>
              </Box>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setPricingForm(emptyPricing); setEditingPricing(null); setPricingDialog(true); }}>New Pricing Strategy</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Current Price</TableCell>
                    <TableCell align="right">Recommended</TableCell>
                    <TableCell align="right">Change %</TableCell>
                    <TableCell align="right">Revenue Impact</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pricing.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No pricing strategies found</TableCell></TableRow>
                  ) : pricing.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography></TableCell>
                      <TableCell><Chip label={item.strategyType || item.strategy_type || '-'} size="small" /></TableCell>
                      <TableCell>{item.productName || item.product_name || '-'}</TableCell>
                      <TableCell><Chip label={item.status} size="small" color={statusColors[item.status] || 'default'} /></TableCell>
                      <TableCell align="right">{formatCurrency(item.currentPrice || item.current_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.recommendedPrice || item.recommended_price)}</TableCell>
                      <TableCell align="right" sx={{ color: (item.priceChangePct || item.price_change_pct || 0) > 0 ? 'success.main' : (item.priceChangePct || item.price_change_pct || 0) < 0 ? 'error.main' : 'text.primary' }}>{formatPct(item.priceChangePct || item.price_change_pct)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.revenueImpact || item.revenue_impact)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditPricing(item)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeletePricing(item.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Dimension</TableCell>
                    <TableCell align="right">Total Revenue</TableCell>
                    <TableCell align="right">Avg Margin</TableCell>
                    <TableCell align="right">Mix Score</TableCell>
                    <TableCell align="right">Opportunity</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mixAnalyses.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No mix analyses found</TableCell></TableRow>
                  ) : mixAnalyses.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={600}>{item.name}</Typography></TableCell>
                      <TableCell><Chip label={item.analysisType || item.analysis_type || '-'} size="small" /></TableCell>
                      <TableCell>{item.dimension || '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalRevenue || item.total_revenue)}</TableCell>
                      <TableCell align="right">{formatPct(item.avgMarginPct || item.avg_margin_pct)}</TableCell>
                      <TableCell align="right">{Number(item.mixScore || item.mix_score || 0).toFixed(1)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.opportunityValue || item.opportunity_value)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (window.confirm('Delete this analysis?')) { await revenueGrowthService.deleteMixAnalysis(item.id); loadMix(); } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 3 && (
          <Box sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Period</TableCell>
                    <TableCell>Metric</TableCell>
                    <TableCell>Dimension</TableCell>
                    <TableCell align="right">Target</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Variance %</TableCell>
                    <TableCell align="right">Growth %</TableCell>
                    <TableCell>Trend</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {growthData.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>No growth tracking data found</TableCell></TableRow>
                  ) : growthData.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.period}</TableCell>
                      <TableCell><Chip label={item.metricType || item.metric_type || '-'} size="small" /></TableCell>
                      <TableCell>{item.dimensionName || item.dimension_name || item.dimension || '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(item.targetValue || item.target_value)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.actualValue || item.actual_value)}</TableCell>
                      <TableCell align="right" sx={{ color: (item.variancePct || item.variance_pct || 0) >= 0 ? 'success.main' : 'error.main' }}>{formatPct(item.variancePct || item.variance_pct)}</TableCell>
                      <TableCell align="right" sx={{ color: (item.growthPct || item.growth_pct || 0) >= 0 ? 'success.main' : 'error.main' }}>{formatPct(item.growthPct || item.growth_pct)}</TableCell>
                      <TableCell><Chip label={item.trendDirection || item.trend_direction || 'flat'} size="small" color={(item.trendDirection || item.trend_direction) === 'up' ? 'success' : (item.trendDirection || item.trend_direction) === 'down' ? 'error' : 'default'} /></TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={async () => { if (window.confirm('Delete this tracker?')) { await revenueGrowthService.deleteGrowthTracker(item.id); loadGrowth(); } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      <Dialog open={initDialog} onClose={() => setInitDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingInit ? 'Edit Initiative' : 'New RGM Initiative'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={initForm.name} onChange={(e) => setInitForm({ ...initForm, name: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={initForm.description} onChange={(e) => setInitForm({ ...initForm, description: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth select label="Type" value={initForm.initiativeType} onChange={(e) => setInitForm({ ...initForm, initiativeType: e.target.value })}>
              {(options?.initiativeTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth select label="Status" value={initForm.status} onChange={(e) => setInitForm({ ...initForm, status: e.target.value })}>
              {['draft','active','completed','paused','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth select label="Priority" value={initForm.priority} onChange={(e) => setInitForm({ ...initForm, priority: e.target.value })}>
              {(options?.priorities || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Channel" value={initForm.channel} onChange={(e) => setInitForm({ ...initForm, channel: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Region" value={initForm.region} onChange={(e) => setInitForm({ ...initForm, region: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Brand" value={initForm.brand} onChange={(e) => setInitForm({ ...initForm, brand: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={initForm.startDate} onChange={(e) => setInitForm({ ...initForm, startDate: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={initForm.endDate} onChange={(e) => setInitForm({ ...initForm, endDate: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth select label="Risk Level" value={initForm.riskLevel} onChange={(e) => setInitForm({ ...initForm, riskLevel: e.target.value })}>
              {(options?.riskLevels || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Target Revenue" type="number" value={initForm.targetRevenue} onChange={(e) => setInitForm({ ...initForm, targetRevenue: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Baseline Revenue" type="number" value={initForm.baselineRevenue} onChange={(e) => setInitForm({ ...initForm, baselineRevenue: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Target Growth %" type="number" value={initForm.targetGrowthPct} onChange={(e) => setInitForm({ ...initForm, targetGrowthPct: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Investment Amount" type="number" value={initForm.investmentAmount} onChange={(e) => setInitForm({ ...initForm, investmentAmount: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Owner" value={initForm.owner} onChange={(e) => setInitForm({ ...initForm, owner: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={initForm.notes} onChange={(e) => setInitForm({ ...initForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInitDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveInitiative} disabled={!initForm.name}>{editingInit ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pricingDialog} onClose={() => setPricingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPricing ? 'Edit Pricing Strategy' : 'New Pricing Strategy'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={pricingForm.name} onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={pricingForm.description} onChange={(e) => setPricingForm({ ...pricingForm, description: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth select label="Strategy Type" value={pricingForm.strategyType} onChange={(e) => setPricingForm({ ...pricingForm, strategyType: e.target.value })}>
              {(options?.strategyTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth select label="Status" value={pricingForm.status} onChange={(e) => setPricingForm({ ...pricingForm, status: e.target.value })}>
              {['draft','active','completed','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Product" value={pricingForm.productName} onChange={(e) => setPricingForm({ ...pricingForm, productName: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Category" value={pricingForm.category} onChange={(e) => setPricingForm({ ...pricingForm, category: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Brand" value={pricingForm.brand} onChange={(e) => setPricingForm({ ...pricingForm, brand: e.target.value })} /></Grid>
            <Grid item xs={6} md={4}><TextField fullWidth label="Channel" value={pricingForm.channel} onChange={(e) => setPricingForm({ ...pricingForm, channel: e.target.value })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Current Price" type="number" value={pricingForm.currentPrice} onChange={(e) => setPricingForm({ ...pricingForm, currentPrice: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Recommended Price" type="number" value={pricingForm.recommendedPrice} onChange={(e) => setPricingForm({ ...pricingForm, recommendedPrice: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Price Change %" type="number" value={pricingForm.priceChangePct} onChange={(e) => setPricingForm({ ...pricingForm, priceChangePct: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Competitor Price" type="number" value={pricingForm.competitorPrice} onChange={(e) => setPricingForm({ ...pricingForm, competitorPrice: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Current Margin %" type="number" value={pricingForm.currentMarginPct} onChange={(e) => setPricingForm({ ...pricingForm, currentMarginPct: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Projected Margin %" type="number" value={pricingForm.projectedMarginPct} onChange={(e) => setPricingForm({ ...pricingForm, projectedMarginPct: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Revenue Impact" type="number" value={pricingForm.revenueImpact} onChange={(e) => setPricingForm({ ...pricingForm, revenueImpact: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Margin Impact" type="number" value={pricingForm.marginImpact} onChange={(e) => setPricingForm({ ...pricingForm, marginImpact: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Effective Date" type="date" InputLabelProps={{ shrink: true }} value={pricingForm.effectiveDate} onChange={(e) => setPricingForm({ ...pricingForm, effectiveDate: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={pricingForm.notes} onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPricingDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePricing} disabled={!pricingForm.name}>{editingPricing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
