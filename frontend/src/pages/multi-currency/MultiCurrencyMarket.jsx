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
  CurrencyExchange as CurrencyIcon, Public as MarketIcon,
  SwapHoriz as RateIcon, PriceChange as PricingIcon
} from '@mui/icons-material';
import { multiCurrencyService } from '../../services/api';

const statusColors = { active: 'success', inactive: 'default', pending: 'warning', expired: 'error' };

const MultiCurrencyMarket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [rates, setRates] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('currency');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const formatCurrency = (val, symbol = 'R') => val ? `${symbol} ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : `${symbol} 0.00`;
  const formatRate = (val) => val ? Number(val).toFixed(6) : '0.000000';
  const formatPct = (val) => val ? `${Number(val).toFixed(1)}%` : '0.0%';

  const loadSummary = useCallback(async () => {
    try { const res = await multiCurrencyService.getSummary(); if (res.success) setSummary(res.data); } catch (e) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try { const res = await multiCurrencyService.getOptions(); if (res.success) setOptions(res.data); } catch (e) { /* ignore */ }
  }, []);

  const loadCurrencies = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      const res = await multiCurrencyService.getCurrencies(params);
      if (res.success) { setCurrencies(res.data || []); setTotal(res.total || 0); }
    } catch (e) { showSnack('Failed to load currencies', 'error'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  const loadRates = useCallback(async () => {
    setLoading(true);
    try { const res = await multiCurrencyService.getExchangeRates({ limit: 100 }); if (res.success) setRates(res.data || []); } catch (e) { showSnack('Failed to load rates', 'error'); }
    setLoading(false);
  }, []);

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    try { const res = await multiCurrencyService.getMarkets({ limit: 100 }); if (res.success) setMarkets(res.data || []); } catch (e) { showSnack('Failed to load markets', 'error'); }
    setLoading(false);
  }, []);

  const loadPricing = useCallback(async () => {
    setLoading(true);
    try { const res = await multiCurrencyService.getPricing({ limit: 100 }); if (res.success) setPricing(res.data || []); } catch (e) { showSnack('Failed to load pricing', 'error'); }
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (marketId) => {
    setLoading(true);
    try { const res = await multiCurrencyService.getMarketById(marketId); if (res.success) setDetail(res.data); } catch (e) { showSnack('Failed to load details', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => {
    if (!id) {
      if (tab === 0) loadCurrencies();
      else if (tab === 1) loadRates();
      else if (tab === 2) loadMarkets();
      else loadPricing();
    }
  }, [id, tab, loadCurrencies, loadRates, loadMarkets, loadPricing]);
  useEffect(() => { if (id) loadDetail(id); }, [id, loadDetail]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setForm(type === 'currency' ? { currencyCode: '', currencyName: '', symbol: '', decimalPlaces: 2, status: 'active' } :
      type === 'rate' ? { fromCurrency: 'ZAR', toCurrency: 'USD', rate: 1, rateType: 'spot', effectiveDate: new Date().toISOString().split('T')[0] } :
      type === 'market' ? { marketCode: '', marketName: '', marketType: 'country', status: 'active', baseCurrency: 'ZAR' } :
      { marketName: '', productName: '', currency: 'ZAR', localPrice: 0, exchangeRate: 1, status: 'active' });
    setDialogOpen(true);
  };

  const handleEdit = (item, type) => { setDialogType(type); setEditItem(item); setForm({ ...item }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      if (dialogType === 'currency') {
        if (editItem) { await multiCurrencyService.updateCurrency(editItem.id, form); showSnack('Currency updated'); }
        else { await multiCurrencyService.createCurrency(form); showSnack('Currency created'); }
        loadCurrencies();
      } else if (dialogType === 'rate') { await multiCurrencyService.createExchangeRate(form); showSnack('Rate created'); loadRates(); }
      else if (dialogType === 'market') {
        if (editItem) { await multiCurrencyService.updateMarket(editItem.id, form); showSnack('Market updated'); }
        else { await multiCurrencyService.createMarket(form); showSnack('Market created'); }
        loadMarkets();
      } else if (dialogType === 'pricing') { await multiCurrencyService.createPricing(form); showSnack('Pricing created'); loadPricing(); }
      loadSummary();
      if (id) loadDetail(id);
      setDialogOpen(false);
    } catch (e) { showSnack('Save failed: ' + (e.response?.data?.message || e.message), 'error'); }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'currency') { await multiCurrencyService.deleteCurrency(itemId); showSnack('Deleted'); loadCurrencies(); }
      else if (type === 'rate') { await multiCurrencyService.deleteExchangeRate(itemId); showSnack('Deleted'); loadRates(); }
      else if (type === 'market') { await multiCurrencyService.deleteMarket(itemId); showSnack('Deleted'); loadMarkets(); }
      else if (type === 'pricing') { await multiCurrencyService.deletePricing(itemId); showSnack('Deleted'); loadPricing(); }
      loadSummary();
    } catch (e) { showSnack('Delete failed', 'error'); }
  };

  if (id && detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/multi-currency')}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{detail.marketName}</Typography>
            <Typography variant="body2" color="text.secondary">{detail.marketCode} | {detail.country} | {detail.baseCurrency}</Typography>
          </Box>
          <Chip label={detail.status} color={statusColors[detail.status] || 'default'} />
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(detail, 'market')}>Edit</Button>
        </Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Market Size</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(detail.marketSize)}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">GDP</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(detail.gdp)}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Tax Rate</Typography><Typography variant="h6" fontWeight={700}>{formatPct(detail.taxRate)}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">VAT Rate</Typography><Typography variant="h6" fontWeight={700}>{formatPct(detail.vatRate)}</Typography></CardContent></Card></Grid>
        </Grid>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Market Pricing ({detail.pricing?.length || 0})</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => { setDialogType('pricing'); setEditItem(null); setForm({ marketId: detail.id, marketName: detail.marketName, currency: detail.baseCurrency, exchangeRate: 1, status: 'active' }); setDialogOpen(true); }}>Add Pricing</Button>
          </Box>
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Local Price</TableCell><TableCell>Base Price</TableCell><TableCell>Margin</TableCell><TableCell>Price Index</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail.pricing || []).map((p) => (<TableRow key={p.id}><TableCell>{p.productName || '—'}</TableCell><TableCell>{p.category || '—'}</TableCell><TableCell>{formatCurrency(p.localPrice, p.currency === 'ZAR' ? 'R' : p.currency)}</TableCell><TableCell>{formatCurrency(p.baseCurrencyPrice)}</TableCell><TableCell>{formatPct(p.localMarginPct)}</TableCell><TableCell>{p.priceIndex}</TableCell><TableCell><Chip label={p.status} size="small" color={statusColors[p.status] || 'default'} /></TableCell></TableRow>))}
              {(!detail.pricing || detail.pricing.length === 0) && <TableRow><TableCell colSpan={7} align="center">No pricing data</TableCell></TableRow>}
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
          <Typography variant="h4" fontWeight={800}>Multi-Currency & Markets</Typography>
          <Typography variant="body2" color="text.secondary">Currency management, exchange rates, market configurations, and market-specific pricing</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => { loadSummary(); if (tab === 0) loadCurrencies(); else if (tab === 1) loadRates(); else if (tab === 2) loadMarkets(); else loadPricing(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate(tab === 0 ? 'currency' : tab === 1 ? 'rate' : tab === 2 ? 'market' : 'pricing')}>
            New {tab === 0 ? 'Currency' : tab === 1 ? 'Exchange Rate' : tab === 2 ? 'Market' : 'Pricing'}
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#F5F3FF', border: '1px solid #E9D5FF' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><CurrencyIcon sx={{ color: '#7C3AED' }} /><Typography variant="body2" color="text.secondary">Currencies</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.currencies?.total || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.currencies?.baseCurrencies || 0} base currencies</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><RateIcon sx={{ color: '#059669' }} /><Typography variant="body2" color="text.secondary">Exchange Rates</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.exchangeRates?.total || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.exchangeRates?.newest ? `Latest: ${summary.exchangeRates.newest}` : 'No rates'}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><MarketIcon sx={{ color: '#2563EB' }} /><Typography variant="body2" color="text.secondary">Markets</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.markets?.total || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.markets?.active || 0} active markets</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#FEF3C7', border: '1px solid #FDE68A' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><PricingIcon sx={{ color: '#D97706' }} /><Typography variant="body2" color="text.secondary">Market Pricing</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.pricing?.total || 0}</Typography><Typography variant="body2" color="text.secondary">Avg margin: {formatPct(summary.pricing?.avgMargin)}</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Currencies" icon={<CurrencyIcon />} iconPosition="start" />
        <Tab label="Exchange Rates" icon={<RateIcon />} iconPosition="start" />
        <Tab label="Markets" icon={<MarketIcon />} iconPosition="start" />
        <Tab label="Market Pricing" icon={<PricingIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}><TextField placeholder="Search currencies..." size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: 300 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} /></Box>
          {loading && <LinearProgress />}
          <TableContainer><Table>
            <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Symbol</TableCell><TableCell>Decimals</TableCell><TableCell>Base</TableCell><TableCell>Country</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {currencies.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell><Typography fontWeight={600}>{c.currencyCode}</Typography></TableCell>
                  <TableCell>{c.currencyName}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell>{c.decimalPlaces}</TableCell>
                  <TableCell>{c.isBaseCurrency ? <Chip label="Base" size="small" color="primary" /> : '—'}</TableCell>
                  <TableCell>{c.country || '—'}</TableCell>
                  <TableCell><Chip label={c.status} size="small" color={statusColors[c.status] || 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(c, 'currency')}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete('currency', c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {currencies.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No currencies configured</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </Paper>
      )}

      {tab === 1 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>From</TableCell><TableCell>To</TableCell><TableCell>Rate</TableCell><TableCell>Inverse</TableCell><TableCell>Type</TableCell><TableCell>Effective Date</TableCell><TableCell>Source</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {rates.map((r) => (<TableRow key={r.id}><TableCell><Typography fontWeight={600}>{r.fromCurrency}</Typography></TableCell><TableCell><Typography fontWeight={600}>{r.toCurrency}</Typography></TableCell><TableCell>{formatRate(r.rate)}</TableCell><TableCell>{formatRate(r.inverseRate)}</TableCell><TableCell><Chip label={r.rateType} size="small" variant="outlined" /></TableCell><TableCell>{r.effectiveDate || '—'}</TableCell><TableCell>{r.source}</TableCell><TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('rate', r.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {rates.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No exchange rates</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      {tab === 2 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Market</TableCell><TableCell>Code</TableCell><TableCell>Type</TableCell><TableCell>Country</TableCell><TableCell>Currency</TableCell><TableCell>Tax</TableCell><TableCell>VAT</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {markets.map((m) => (
              <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/multi-currency/${m.id}`)}>
                <TableCell><Typography fontWeight={600}>{m.marketName}</Typography></TableCell>
                <TableCell>{m.marketCode}</TableCell>
                <TableCell><Chip label={m.marketType} size="small" variant="outlined" /></TableCell>
                <TableCell>{m.country || '—'}</TableCell>
                <TableCell>{m.baseCurrency}</TableCell>
                <TableCell>{formatPct(m.taxRate)}</TableCell>
                <TableCell>{formatPct(m.vatRate)}</TableCell>
                <TableCell><Chip label={m.status} size="small" color={statusColors[m.status] || 'default'} /></TableCell>
                <TableCell>
                  <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(m, 'market'); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('market', m.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {markets.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No markets configured</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      {tab === 3 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Product</TableCell><TableCell>Market</TableCell><TableCell>Currency</TableCell><TableCell>Local Price</TableCell><TableCell>Base Price</TableCell><TableCell>Margin</TableCell><TableCell>Index</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {pricing.map((p) => (<TableRow key={p.id}><TableCell>{p.productName || '—'}</TableCell><TableCell>{p.marketName || '—'}</TableCell><TableCell>{p.currency}</TableCell><TableCell>{formatCurrency(p.localPrice, p.currency === 'ZAR' ? 'R' : p.currency)}</TableCell><TableCell>{formatCurrency(p.baseCurrencyPrice)}</TableCell><TableCell>{formatPct(p.localMarginPct)}</TableCell><TableCell>{p.priceIndex}</TableCell><TableCell><Chip label={p.status} size="small" color={statusColors[p.status] || 'default'} /></TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('pricing', p.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {pricing.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No market pricing data</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'New'} {dialogType === 'currency' ? 'Currency' : dialogType === 'rate' ? 'Exchange Rate' : dialogType === 'market' ? 'Market' : 'Market Pricing'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {dialogType === 'currency' && (<>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Code" value={form.currencyCode || ''} onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })} fullWidth required inputProps={{ maxLength: 3 }} /></Grid>
                <Grid item xs={4}><TextField label="Symbol" value={form.symbol || ''} onChange={(e) => setForm({ ...form, symbol: e.target.value })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Decimals" type="number" value={form.decimalPlaces ?? 2} onChange={(e) => setForm({ ...form, decimalPlaces: parseInt(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
              <TextField label="Name" value={form.currencyName || ''} onChange={(e) => setForm({ ...form, currencyName: e.target.value })} fullWidth required />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Country" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Rounding" select value={form.roundingMethod || 'standard'} onChange={(e) => setForm({ ...form, roundingMethod: e.target.value })} fullWidth>{(options?.roundingMethods || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              </Grid>
            </>)}
            {dialogType === 'rate' && (<>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="From Currency" value={form.fromCurrency || ''} onChange={(e) => setForm({ ...form, fromCurrency: e.target.value.toUpperCase() })} fullWidth required /></Grid>
                <Grid item xs={6}><TextField label="To Currency" value={form.toCurrency || ''} onChange={(e) => setForm({ ...form, toCurrency: e.target.value.toUpperCase() })} fullWidth required /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Rate" type="number" value={form.rate || ''} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })} fullWidth required inputProps={{ step: '0.000001' }} /></Grid>
                <Grid item xs={6}><TextField label="Type" select value={form.rateType || 'spot'} onChange={(e) => setForm({ ...form, rateType: e.target.value })} fullWidth>{(options?.rateTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Effective Date" type="date" value={form.effectiveDate || ''} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} required /></Grid>
                <Grid item xs={6}><TextField label="Source" value={form.source || 'manual'} onChange={(e) => setForm({ ...form, source: e.target.value })} fullWidth /></Grid>
              </Grid>
            </>)}
            {dialogType === 'market' && (<>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Code" value={form.marketCode || ''} onChange={(e) => setForm({ ...form, marketCode: e.target.value.toUpperCase() })} fullWidth required /></Grid>
                <Grid item xs={8}><TextField label="Name" value={form.marketName || ''} onChange={(e) => setForm({ ...form, marketName: e.target.value })} fullWidth required /></Grid>
              </Grid>
              <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Type" select value={form.marketType || 'country'} onChange={(e) => setForm({ ...form, marketType: e.target.value })} fullWidth>{(options?.marketTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
                <Grid item xs={4}><TextField label="Country" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Base Currency" value={form.baseCurrency || 'ZAR'} onChange={(e) => setForm({ ...form, baseCurrency: e.target.value.toUpperCase() })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Tax Rate %" type="number" value={form.taxRate || ''} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="VAT Rate %" type="number" value={form.vatRate || ''} onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Market Size" type="number" value={form.marketSize || ''} onChange={(e) => setForm({ ...form, marketSize: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
            </>)}
            {dialogType === 'pricing' && (<>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Product Name" value={form.productName || ''} onChange={(e) => setForm({ ...form, productName: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Market Name" value={form.marketName || ''} onChange={(e) => setForm({ ...form, marketName: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Currency" value={form.currency || 'ZAR'} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Local Price" type="number" value={form.localPrice || ''} onChange={(e) => setForm({ ...form, localPrice: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Exchange Rate" type="number" value={form.exchangeRate || ''} onChange={(e) => setForm({ ...form, exchangeRate: parseFloat(e.target.value) || 0 })} fullWidth inputProps={{ step: '0.0001' }} /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Tax Amount" type="number" value={form.taxAmount || ''} onChange={(e) => setForm({ ...form, taxAmount: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Duty Amount" type="number" value={form.dutyAmount || ''} onChange={(e) => setForm({ ...form, dutyAmount: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Margin %" type="number" value={form.localMarginPct || ''} onChange={(e) => setForm({ ...form, localMarginPct: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
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

export default MultiCurrencyMarket;
