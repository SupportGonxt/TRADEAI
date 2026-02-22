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
  Business as CompetitorIcon, PieChart as ShareIcon,
  TrendingUp as TrendIcon, CompareArrows as PriceIcon
} from '@mui/icons-material';
import { marketIntelligenceService } from '../../services/api';

const statusColors = {
  active: 'success', inactive: 'default', archived: 'default',
  growing: 'success', stable: 'info', declining: 'error', volatile: 'warning'
};

const threatColors = { low: 'success', medium: 'warning', high: 'error', critical: 'error' };

const MarketIntelligence = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [marketShare, setMarketShare] = useState([]);
  const [prices, setPrices] = useState([]);
  const [trends, setTrends] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('competitor');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const formatCurrency = (val) => val ? `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00';
  const formatPct = (val) => val ? `${Number(val).toFixed(1)}%` : '0.0%';

  const loadSummary = useCallback(async () => {
    try { const res = await marketIntelligenceService.getSummary(); if (res.success) setSummary(res.data); } catch (e) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try { const res = await marketIntelligenceService.getOptions(); if (res.success) setOptions(res.data); } catch (e) { /* ignore */ }
  }, []);

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      const res = await marketIntelligenceService.getCompetitors(params);
      if (res.success) { setCompetitors(res.data || []); setTotal(res.total || 0); }
    } catch (e) { showSnack('Failed to load competitors', 'error'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  const loadMarketShare = useCallback(async () => {
    setLoading(true);
    try { const res = await marketIntelligenceService.getMarketShare({ limit: 100 }); if (res.success) setMarketShare(res.data || []); } catch (e) { showSnack('Failed to load market share', 'error'); }
    setLoading(false);
  }, []);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    try { const res = await marketIntelligenceService.getPrices({ limit: 100 }); if (res.success) setPrices(res.data || []); } catch (e) { showSnack('Failed to load prices', 'error'); }
    setLoading(false);
  }, []);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    try { const res = await marketIntelligenceService.getTrends({ limit: 100 }); if (res.success) setTrends(res.data || []); } catch (e) { showSnack('Failed to load trends', 'error'); }
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (competitorId) => {
    setLoading(true);
    try { const res = await marketIntelligenceService.getCompetitorById(competitorId); if (res.success) setDetail(res.data); } catch (e) { showSnack('Failed to load details', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => {
    if (!id) {
      if (tab === 0) loadCompetitors();
      else if (tab === 1) loadMarketShare();
      else if (tab === 2) loadPrices();
      else loadTrends();
    }
  }, [id, tab, loadCompetitors, loadMarketShare, loadPrices, loadTrends]);
  useEffect(() => { if (id) loadDetail(id); }, [id, loadDetail]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setForm(type === 'competitor' ? { name: '', competitorType: 'direct', status: 'active', threatLevel: 'medium' } :
      type === 'share' ? { period: '', companySharePct: 0, competitorSharePct: 0 } :
      type === 'price' ? { ourPrice: 0, competitorPrice: 0, priceIndex: 100 } :
      { name: '', trendType: 'market', direction: 'stable', status: 'active' });
    setDialogOpen(true);
  };

  const handleEdit = (item) => { setDialogType('competitor'); setEditItem(item); setForm({ ...item }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      if (dialogType === 'competitor') {
        if (editItem) { await marketIntelligenceService.updateCompetitor(editItem.id, form); showSnack('Competitor updated'); }
        else { await marketIntelligenceService.createCompetitor(form); showSnack('Competitor created'); }
        loadCompetitors();
      } else if (dialogType === 'share') { await marketIntelligenceService.createMarketShare(form); showSnack('Market share data added'); loadMarketShare(); }
      else if (dialogType === 'price') { await marketIntelligenceService.createPrice(form); showSnack('Price data added'); loadPrices(); }
      else if (dialogType === 'trend') { await marketIntelligenceService.createTrend(form); showSnack('Trend added'); loadTrends(); }
      loadSummary();
      if (id) loadDetail(id);
      setDialogOpen(false);
    } catch (e) { showSnack('Save failed: ' + (e.response?.data?.message || e.message), 'error'); }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'competitor') { await marketIntelligenceService.deleteCompetitor(itemId); showSnack('Competitor deleted'); loadCompetitors(); }
      else if (type === 'share') { await marketIntelligenceService.deleteMarketShare(itemId); showSnack('Deleted'); loadMarketShare(); }
      else if (type === 'price') { await marketIntelligenceService.deletePrice(itemId); showSnack('Deleted'); loadPrices(); }
      else if (type === 'trend') { await marketIntelligenceService.deleteTrend(itemId); showSnack('Deleted'); loadTrends(); }
      loadSummary();
      if (id) loadDetail(id);
    } catch (e) { showSnack('Delete failed', 'error'); }
  };

  if (id && detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/market-intelligence')}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{detail.name}</Typography>
            <Typography variant="body2" color="text.secondary">{detail.competitorType} competitor | {detail.headquarters || 'Unknown HQ'}</Typography>
          </Box>
          <Chip label={detail.threatLevel} color={threatColors[detail.threatLevel] || 'default'} />
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(detail)}>Edit</Button>
        </Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Annual Revenue</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(detail.annualRevenue)}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Market Share</Typography><Typography variant="h6" fontWeight={700}>{formatPct(detail.marketSharePct)}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Employees</Typography><Typography variant="h6" fontWeight={700}>{detail.employeeCount?.toLocaleString() || '—'}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Website</Typography><Typography variant="h6" fontWeight={700}>{detail.website || '—'}</Typography></CardContent></Card></Grid>
        </Grid>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Competitive Prices ({detail.prices?.length || 0})</Typography>
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Our Price</TableCell><TableCell>Their Price</TableCell><TableCell>Index</TableCell><TableCell>Gap</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail.prices || []).map((p) => (<TableRow key={p.id}><TableCell>{p.productName || '—'}</TableCell><TableCell>{formatCurrency(p.ourPrice)}</TableCell><TableCell>{formatCurrency(p.competitorPrice)}</TableCell><TableCell>{p.priceIndex}</TableCell><TableCell><Typography color={p.priceGapPct > 0 ? 'error.main' : 'success.main'}>{formatPct(p.priceGapPct)}</Typography></TableCell><TableCell>{p.observedDate || '—'}</TableCell></TableRow>))}
              {(!detail.prices || detail.prices.length === 0) && <TableRow><TableCell colSpan={6} align="center">No price data</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Market Share History ({detail.marketShares?.length || 0})</Typography>
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Period</TableCell><TableCell>Category</TableCell><TableCell>Our Share</TableCell><TableCell>Their Share</TableCell><TableCell>Change</TableCell><TableCell>Market Size</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail.marketShares || []).map((s) => (<TableRow key={s.id}><TableCell>{s.period}</TableCell><TableCell>{s.category || '—'}</TableCell><TableCell>{formatPct(s.companySharePct)}</TableCell><TableCell>{formatPct(s.competitorSharePct)}</TableCell><TableCell><Typography color={s.shareChangePct > 0 ? 'success.main' : 'error.main'}>{formatPct(s.shareChangePct)}</Typography></TableCell><TableCell>{formatCurrency(s.marketSize)}</TableCell></TableRow>))}
              {(!detail.marketShares || detail.marketShares.length === 0) && <TableRow><TableCell colSpan={6} align="center">No market share data</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Paper>
        <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}><Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert></Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Market Intelligence</Typography>
          <Typography variant="body2" color="text.secondary">Competitor tracking, market share, competitive pricing, and market trends</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => { loadSummary(); if (tab === 0) loadCompetitors(); else if (tab === 1) loadMarketShare(); else if (tab === 2) loadPrices(); else loadTrends(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate(tab === 0 ? 'competitor' : tab === 1 ? 'share' : tab === 2 ? 'price' : 'trend')}>
            New {tab === 0 ? 'Competitor' : tab === 1 ? 'Market Share' : tab === 2 ? 'Price Point' : 'Trend'}
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}><Card sx={{ bgcolor: '#F5F3FF', border: '1px solid #E9D5FF' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><CompetitorIcon sx={{ color: '#7C3AED' }} /><Typography variant="body2" color="text.secondary">Competitors</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.competitors?.total || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.competitors?.active || 0} active</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={2.4}><Card sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><ShareIcon sx={{ color: '#059669' }} /><Typography variant="body2" color="text.secondary">Avg Market Share</Typography></Box><Typography variant="h4" fontWeight={700}>{formatPct(summary.avgMarketShare)}</Typography><Typography variant="body2" color="text.secondary">{summary.marketShareEntries || 0} entries</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={2.4}><Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><PriceIcon sx={{ color: '#2563EB' }} /><Typography variant="body2" color="text.secondary">Avg Price Index</Typography></Box><Typography variant="h4" fontWeight={700}>{(summary.avgPriceIndex || 100).toFixed(0)}</Typography><Typography variant="body2" color="text.secondary">{summary.pricePoints || 0} data points</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={2.4}><Card sx={{ bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><TrendIcon sx={{ color: '#D97706' }} /><Typography variant="body2" color="text.secondary">Active Trends</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.activeTrends || 0}</Typography><Typography variant="body2" color="text.secondary">being tracked</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Competitors" icon={<CompetitorIcon />} iconPosition="start" />
        <Tab label="Market Share" icon={<ShareIcon />} iconPosition="start" />
        <Tab label="Competitive Pricing" icon={<PriceIcon />} iconPosition="start" />
        <Tab label="Market Trends" icon={<TrendIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}><TextField placeholder="Search competitors..." size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: 300 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} /></Box>
          {loading && <LinearProgress />}
          <TableContainer><Table>
            <TableHead><TableRow><TableCell>Competitor</TableCell><TableCell>Type</TableCell><TableCell>Revenue</TableCell><TableCell>Market Share</TableCell><TableCell>Threat</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {competitors.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/market-intelligence/${c.id}`)}>
                  <TableCell><Typography fontWeight={600}>{c.name}</Typography><Typography variant="caption" color="text.secondary">{c.headquarters || ''}</Typography></TableCell>
                  <TableCell><Chip label={c.competitorType} size="small" variant="outlined" /></TableCell>
                  <TableCell>{formatCurrency(c.annualRevenue)}</TableCell>
                  <TableCell>{formatPct(c.marketSharePct)}</TableCell>
                  <TableCell><Chip label={c.threatLevel} size="small" color={threatColors[c.threatLevel] || 'default'} /></TableCell>
                  <TableCell><Chip label={c.status} size="small" color={statusColors[c.status] || 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('competitor', c.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {competitors.length === 0 && !loading && <TableRow><TableCell colSpan={7} align="center">No competitors found</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </Paper>
      )}

      {tab === 1 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Period</TableCell><TableCell>Category</TableCell><TableCell>Competitor</TableCell><TableCell>Our Share</TableCell><TableCell>Their Share</TableCell><TableCell>Change</TableCell><TableCell>Market Size</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {marketShare.map((s) => (<TableRow key={s.id}><TableCell>{s.period}</TableCell><TableCell>{s.category || '—'}</TableCell><TableCell>{s.competitorName || '—'}</TableCell><TableCell>{formatPct(s.companySharePct)}</TableCell><TableCell>{formatPct(s.competitorSharePct)}</TableCell><TableCell><Typography color={s.shareChangePct > 0 ? 'success.main' : 'error.main'}>{formatPct(s.shareChangePct)}</Typography></TableCell><TableCell>{formatCurrency(s.marketSize)}</TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('share', s.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {marketShare.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No market share data</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      {tab === 2 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Competitor</TableCell><TableCell>Our Price</TableCell><TableCell>Their Price</TableCell><TableCell>Index</TableCell><TableCell>Gap</TableCell><TableCell>Date</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {prices.map((p) => (<TableRow key={p.id}><TableCell>{p.productName || '—'}</TableCell><TableCell>{p.competitorName || '—'}</TableCell><TableCell>{formatCurrency(p.ourPrice)}</TableCell><TableCell>{formatCurrency(p.competitorPrice)}</TableCell><TableCell>{p.priceIndex}</TableCell><TableCell><Typography color={p.priceGapPct > 0 ? 'error.main' : 'success.main'}>{formatPct(p.priceGapPct)}</Typography></TableCell><TableCell>{p.observedDate || '—'}</TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('price', p.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {prices.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No competitive price data</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      {tab === 3 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Trend</TableCell><TableCell>Type</TableCell><TableCell>Category</TableCell><TableCell>Direction</TableCell><TableCell>Impact</TableCell><TableCell>Confidence</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {trends.map((t) => (<TableRow key={t.id}><TableCell><Typography fontWeight={600}>{t.name}</Typography></TableCell><TableCell><Chip label={t.trendType} size="small" variant="outlined" /></TableCell><TableCell>{t.category || '—'}</TableCell><TableCell><Chip label={t.direction} size="small" color={statusColors[t.direction] || 'default'} /></TableCell><TableCell>{t.impactScore}/10</TableCell><TableCell>{formatPct(t.confidenceScore)}</TableCell><TableCell><Chip label={t.status} size="small" color={statusColors[t.status] || 'default'} /></TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('trend', t.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {trends.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No market trends found</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'New'} {dialogType === 'competitor' ? 'Competitor' : dialogType === 'share' ? 'Market Share' : dialogType === 'price' ? 'Price Point' : 'Market Trend'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {dialogType === 'competitor' && (<>
              <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
              <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
              <TextField label="Type" select value={form.competitorType || 'direct'} onChange={(e) => setForm({ ...form, competitorType: e.target.value })} fullWidth>
                {(options?.competitorTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Website" value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Headquarters" value={form.headquarters || ''} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Annual Revenue" type="number" value={form.annualRevenue || ''} onChange={(e) => setForm({ ...form, annualRevenue: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Market Share %" type="number" value={form.marketSharePct || ''} onChange={(e) => setForm({ ...form, marketSharePct: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Employees" type="number" value={form.employeeCount || ''} onChange={(e) => setForm({ ...form, employeeCount: parseInt(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
              <TextField label="Threat Level" select value={form.threatLevel || 'medium'} onChange={(e) => setForm({ ...form, threatLevel: e.target.value })} fullWidth>
                {(options?.threatLevels || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </>)}
            {dialogType === 'share' && (<>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Period" value={form.period || ''} onChange={(e) => setForm({ ...form, period: e.target.value })} fullWidth placeholder="e.g. Q1 2025" /></Grid>
                <Grid item xs={6}><TextField label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth /></Grid>
              </Grid>
              <TextField label="Competitor Name" value={form.competitorName || ''} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Our Share %" type="number" value={form.companySharePct || ''} onChange={(e) => setForm({ ...form, companySharePct: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Their Share %" type="number" value={form.competitorSharePct || ''} onChange={(e) => setForm({ ...form, competitorSharePct: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Market Size" type="number" value={form.marketSize || ''} onChange={(e) => setForm({ ...form, marketSize: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
            </>)}
            {dialogType === 'price' && (<>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Product Name" value={form.productName || ''} onChange={(e) => setForm({ ...form, productName: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Competitor Name" value={form.competitorName || ''} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Our Price" type="number" value={form.ourPrice || ''} onChange={(e) => setForm({ ...form, ourPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Their Price" type="number" value={form.competitorPrice || ''} onChange={(e) => setForm({ ...form, competitorPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Observed Date" type="date" value={form.observedDate || ''} onChange={(e) => setForm({ ...form, observedDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
            </>)}
            {dialogType === 'trend' && (<>
              <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
              <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Type" select value={form.trendType || 'market'} onChange={(e) => setForm({ ...form, trendType: e.target.value })} fullWidth>{(options?.trendTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
                <Grid item xs={6}><TextField label="Direction" select value={form.direction || 'stable'} onChange={(e) => setForm({ ...form, direction: e.target.value })} fullWidth>{(options?.directions || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Impact Score (0-10)" type="number" value={form.impactScore || ''} onChange={(e) => setForm({ ...form, impactScore: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth /></Grid>
              </Grid>
            </>)}
            <TextField label="Notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}><Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert></Snackbar>
    </Box>
  );
};

export default MarketIntelligence;
