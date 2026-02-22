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
  LocalShipping as ShipIcon, Inventory as InventoryIcon,
  Warning as AlertIcon, Business as SupplierIcon
} from '@mui/icons-material';
import { supplyChainService } from '../../services/api';

const statusColors = {
  active: 'success', inactive: 'default', pending: 'warning',
  in_transit: 'info', delivered: 'success', cancelled: 'error',
  normal: 'success', low: 'warning', critical: 'error', overstock: 'info', stockout: 'error',
  open: 'warning', resolved: 'success', acknowledged: 'info'
};

const severityColors = { low: 'success', medium: 'warning', high: 'error', critical: 'error' };

const SupplyChainManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('supplier');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const formatCurrency = (val) => val ? `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00';
  const formatPct = (val) => val ? `${Number(val).toFixed(1)}%` : '0.0%';
  const formatNum = (val) => val ? Number(val).toLocaleString() : '0';

  const loadSummary = useCallback(async () => {
    try { const res = await supplyChainService.getSummary(); if (res.success) setSummary(res.data); } catch (e) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try { const res = await supplyChainService.getOptions(); if (res.success) setOptions(res.data); } catch (e) { /* ignore */ }
  }, []);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      const res = await supplyChainService.getSuppliers(params);
      if (res.success) { setSuppliers(res.data || []); setTotal(res.total || 0); }
    } catch (e) { showSnack('Failed to load suppliers', 'error'); }
    setLoading(false);
  }, [page, rowsPerPage, search]);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try { const res = await supplyChainService.getInventory({ limit: 100 }); if (res.success) setInventory(res.data || []); } catch (e) { showSnack('Failed to load inventory', 'error'); }
    setLoading(false);
  }, []);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    try { const res = await supplyChainService.getShipments({ limit: 100 }); if (res.success) setShipments(res.data || []); } catch (e) { showSnack('Failed to load shipments', 'error'); }
    setLoading(false);
  }, []);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try { const res = await supplyChainService.getAlerts({ limit: 100 }); if (res.success) setAlerts(res.data || []); } catch (e) { showSnack('Failed to load alerts', 'error'); }
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (supplierId) => {
    setLoading(true);
    try { const res = await supplyChainService.getSupplierById(supplierId); if (res.success) setDetail(res.data); } catch (e) { showSnack('Failed to load details', 'error'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => {
    if (!id) {
      if (tab === 0) loadSuppliers();
      else if (tab === 1) loadInventory();
      else if (tab === 2) loadShipments();
      else loadAlerts();
    }
  }, [id, tab, loadSuppliers, loadInventory, loadShipments, loadAlerts]);
  useEffect(() => { if (id) loadDetail(id); }, [id, loadDetail]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setForm(type === 'supplier' ? { name: '', supplierType: 'manufacturer', status: 'active' } :
      type === 'inventory' ? { productName: '', currentQty: 0, unitCost: 0, stockStatus: 'normal' } :
      type === 'shipment' ? { shipmentType: 'outbound', status: 'pending' } :
      { title: '', alertType: 'stockout', severity: 'medium', status: 'open' });
    setDialogOpen(true);
  };

  const handleEdit = (item) => { setDialogType('supplier'); setEditItem(item); setForm({ ...item }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      if (dialogType === 'supplier') {
        if (editItem) { await supplyChainService.updateSupplier(editItem.id, form); showSnack('Supplier updated'); }
        else { await supplyChainService.createSupplier(form); showSnack('Supplier created'); }
        loadSuppliers();
      } else if (dialogType === 'inventory') { await supplyChainService.createInventory(form); showSnack('Inventory added'); loadInventory(); }
      else if (dialogType === 'shipment') { await supplyChainService.createShipment(form); showSnack('Shipment created'); loadShipments(); }
      else if (dialogType === 'alert') { await supplyChainService.createAlert(form); showSnack('Alert created'); loadAlerts(); }
      loadSummary();
      if (id) loadDetail(id);
      setDialogOpen(false);
    } catch (e) { showSnack('Save failed: ' + (e.response?.data?.message || e.message), 'error'); }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'supplier') { await supplyChainService.deleteSupplier(itemId); showSnack('Supplier deleted'); loadSuppliers(); }
      else if (type === 'inventory') { await supplyChainService.deleteInventory(itemId); showSnack('Deleted'); loadInventory(); }
      else if (type === 'shipment') { await supplyChainService.deleteShipment(itemId); showSnack('Deleted'); loadShipments(); }
      else if (type === 'alert') { await supplyChainService.deleteAlert(itemId); showSnack('Deleted'); loadAlerts(); }
      loadSummary();
    } catch (e) { showSnack('Delete failed', 'error'); }
  };

  if (id && detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/supply-chain')}><BackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{detail.name}</Typography>
            <Typography variant="body2" color="text.secondary">{detail.supplierType} | {detail.city}, {detail.country}</Typography>
          </Box>
          <Chip label={detail.status} color={statusColors[detail.status] || 'default'} />
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleEdit(detail)}>Edit</Button>
        </Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Annual Spend</Typography><Typography variant="h6" fontWeight={700}>{formatCurrency(detail.annualSpend)}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Reliability</Typography><Typography variant="h6" fontWeight={700}>{detail.reliabilityScore}/10</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Quality</Typography><Typography variant="h6" fontWeight={700}>{detail.qualityScore}/10</Typography></CardContent></Card></Grid>
          <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Lead Time</Typography><Typography variant="h6" fontWeight={700}>{detail.leadTimeDays} days</Typography></CardContent></Card></Grid>
        </Grid>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Inventory ({detail.inventory?.length || 0})</Typography>
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell>SKU</TableCell><TableCell>Qty</TableCell><TableCell>Available</TableCell><TableCell>Value</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail.inventory || []).map((i) => (<TableRow key={i.id}><TableCell>{i.productName || '—'}</TableCell><TableCell>{i.sku || '—'}</TableCell><TableCell>{formatNum(i.currentQty)}</TableCell><TableCell>{formatNum(i.availableQty)}</TableCell><TableCell>{formatCurrency(i.totalValue)}</TableCell><TableCell><Chip label={i.stockStatus} size="small" color={statusColors[i.stockStatus] || 'default'} /></TableCell></TableRow>))}
              {(!detail.inventory || detail.inventory.length === 0) && <TableRow><TableCell colSpan={6} align="center">No inventory data</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Shipments ({detail.shipments?.length || 0})</Typography>
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Number</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Ship Date</TableCell><TableCell>Destination</TableCell><TableCell>Cost</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail.shipments || []).map((s) => (<TableRow key={s.id}><TableCell>{s.shipmentNumber || '—'}</TableCell><TableCell>{s.shipmentType}</TableCell><TableCell><Chip label={s.status} size="small" color={statusColors[s.status] || 'default'} /></TableCell><TableCell>{s.shipDate || '—'}</TableCell><TableCell>{s.destination || '—'}</TableCell><TableCell>{formatCurrency(s.totalCost)}</TableCell></TableRow>))}
              {(!detail.shipments || detail.shipments.length === 0) && <TableRow><TableCell colSpan={6} align="center">No shipments</TableCell></TableRow>}
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
          <Typography variant="h4" fontWeight={800}>Supply Chain</Typography>
          <Typography variant="body2" color="text.secondary">Supplier management, inventory levels, shipments, and supply chain alerts</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<RefreshIcon />} onClick={() => { loadSummary(); if (tab === 0) loadSuppliers(); else if (tab === 1) loadInventory(); else if (tab === 2) loadShipments(); else loadAlerts(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate(tab === 0 ? 'supplier' : tab === 1 ? 'inventory' : tab === 2 ? 'shipment' : 'alert')}>
            New {tab === 0 ? 'Supplier' : tab === 1 ? 'Inventory Item' : tab === 2 ? 'Shipment' : 'Alert'}
          </Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#F5F3FF', border: '1px solid #E9D5FF' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><SupplierIcon sx={{ color: '#7C3AED' }} /><Typography variant="body2" color="text.secondary">Suppliers</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.suppliers?.total || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.suppliers?.active || 0} active | {formatCurrency(summary.suppliers?.totalSpend)} total spend</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><InventoryIcon sx={{ color: '#059669' }} /><Typography variant="body2" color="text.secondary">Inventory</Typography></Box><Typography variant="h4" fontWeight={700}>{formatCurrency(summary.inventory?.totalValue)}</Typography><Typography variant="body2" color="text.secondary">{summary.inventory?.total || 0} items | {summary.inventory?.atRisk || 0} at risk</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><ShipIcon sx={{ color: '#2563EB' }} /><Typography variant="body2" color="text.secondary">Shipments</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.shipments?.total || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.shipments?.inTransit || 0} in transit | {formatPct(summary.shipments?.onTimePct)} on-time</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card sx={{ bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><AlertIcon sx={{ color: '#DC2626' }} /><Typography variant="body2" color="text.secondary">Alerts</Typography></Box><Typography variant="h4" fontWeight={700}>{summary.alerts?.openAlerts || 0}</Typography><Typography variant="body2" color="text.secondary">{summary.alerts?.critical || 0} critical | {summary.alerts?.total || 0} total</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Suppliers" icon={<SupplierIcon />} iconPosition="start" />
        <Tab label="Inventory" icon={<InventoryIcon />} iconPosition="start" />
        <Tab label="Shipments" icon={<ShipIcon />} iconPosition="start" />
        <Tab label="Alerts" icon={<AlertIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}><TextField placeholder="Search suppliers..." size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: 300 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} /></Box>
          {loading && <LinearProgress />}
          <TableContainer><Table>
            <TableHead><TableRow><TableCell>Supplier</TableCell><TableCell>Type</TableCell><TableCell>Annual Spend</TableCell><TableCell>Reliability</TableCell><TableCell>Lead Time</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/supply-chain/${s.id}`)}>
                  <TableCell><Typography fontWeight={600}>{s.name}</Typography><Typography variant="caption" color="text.secondary">{s.city}, {s.country}</Typography></TableCell>
                  <TableCell><Chip label={s.supplierType} size="small" variant="outlined" /></TableCell>
                  <TableCell>{formatCurrency(s.annualSpend)}</TableCell>
                  <TableCell>{s.reliabilityScore}/10</TableCell>
                  <TableCell>{s.leadTimeDays} days</TableCell>
                  <TableCell><Chip label={s.status} size="small" color={statusColors[s.status] || 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(s); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('supplier', s.id); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {suppliers.length === 0 && !loading && <TableRow><TableCell colSpan={7} align="center">No suppliers found</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
          <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage} onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
        </Paper>
      )}

      {tab === 1 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Product</TableCell><TableCell>SKU</TableCell><TableCell>Warehouse</TableCell><TableCell>Qty</TableCell><TableCell>Available</TableCell><TableCell>Value</TableCell><TableCell>Days Supply</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {inventory.map((i) => (<TableRow key={i.id}><TableCell>{i.productName || '—'}</TableCell><TableCell>{i.sku || '—'}</TableCell><TableCell>{i.warehouseName || '—'}</TableCell><TableCell>{formatNum(i.currentQty)}</TableCell><TableCell>{formatNum(i.availableQty)}</TableCell><TableCell>{formatCurrency(i.totalValue)}</TableCell><TableCell>{i.daysOfSupply}</TableCell><TableCell><Chip label={i.stockStatus} size="small" color={statusColors[i.stockStatus] || 'default'} /></TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('inventory', i.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {inventory.length === 0 && !loading && <TableRow><TableCell colSpan={9} align="center">No inventory data</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      {tab === 2 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Shipment #</TableCell><TableCell>Type</TableCell><TableCell>Customer/Supplier</TableCell><TableCell>Origin → Dest</TableCell><TableCell>Ship Date</TableCell><TableCell>Status</TableCell><TableCell>Cost</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {shipments.map((s) => (<TableRow key={s.id}><TableCell>{s.shipmentNumber || '—'}</TableCell><TableCell><Chip label={s.shipmentType} size="small" variant="outlined" /></TableCell><TableCell>{s.customerName || s.supplierName || '—'}</TableCell><TableCell>{s.origin || '—'} → {s.destination || '—'}</TableCell><TableCell>{s.shipDate || '—'}</TableCell><TableCell><Chip label={s.status} size="small" color={statusColors[s.status] || 'default'} /></TableCell><TableCell>{formatCurrency(s.totalCost)}</TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('shipment', s.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {shipments.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No shipments</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      {tab === 3 && (
        <Paper>{loading && <LinearProgress />}<TableContainer><Table>
          <TableHead><TableRow><TableCell>Alert</TableCell><TableCell>Type</TableCell><TableCell>Severity</TableCell><TableCell>Product</TableCell><TableCell>Supplier</TableCell><TableCell>Impact</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {alerts.map((a) => (<TableRow key={a.id}><TableCell><Typography fontWeight={600}>{a.title}</Typography></TableCell><TableCell><Chip label={a.alertType} size="small" variant="outlined" /></TableCell><TableCell><Chip label={a.severity} size="small" color={severityColors[a.severity] || 'default'} /></TableCell><TableCell>{a.productName || '—'}</TableCell><TableCell>{a.supplierName || '—'}</TableCell><TableCell>{formatCurrency(a.impactValue)}</TableCell><TableCell><Chip label={a.status} size="small" color={statusColors[a.status] || 'default'} /></TableCell><TableCell><IconButton size="small" onClick={() => handleDelete('alert', a.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell></TableRow>))}
            {alerts.length === 0 && !loading && <TableRow><TableCell colSpan={8} align="center">No alerts</TableCell></TableRow>}
          </TableBody>
        </Table></TableContainer></Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'New'} {dialogType === 'supplier' ? 'Supplier' : dialogType === 'inventory' ? 'Inventory Item' : dialogType === 'shipment' ? 'Shipment' : 'Alert'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {dialogType === 'supplier' && (<>
              <TextField label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth required />
              <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
              <TextField label="Type" select value={form.supplierType || 'manufacturer'} onChange={(e) => setForm({ ...form, supplierType: e.target.value })} fullWidth>
                {(options?.supplierTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Contact Name" value={form.contactName || ''} onChange={(e) => setForm({ ...form, contactName: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Contact Email" value={form.contactEmail || ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="City" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Country" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Lead Time (days)" type="number" value={form.leadTimeDays || ''} onChange={(e) => setForm({ ...form, leadTimeDays: parseInt(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Reliability (0-10)" type="number" value={form.reliabilityScore || ''} onChange={(e) => setForm({ ...form, reliabilityScore: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Quality (0-10)" type="number" value={form.qualityScore || ''} onChange={(e) => setForm({ ...form, qualityScore: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Annual Spend" type="number" value={form.annualSpend || ''} onChange={(e) => setForm({ ...form, annualSpend: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
            </>)}
            {dialogType === 'inventory' && (<>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Product Name" value={form.productName || ''} onChange={(e) => setForm({ ...form, productName: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="SKU" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Warehouse" value={form.warehouseName || ''} onChange={(e) => setForm({ ...form, warehouseName: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Current Qty" type="number" value={form.currentQty || ''} onChange={(e) => setForm({ ...form, currentQty: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Unit Cost" type="number" value={form.unitCost || ''} onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Reorder Point" type="number" value={form.reorderPoint || ''} onChange={(e) => setForm({ ...form, reorderPoint: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
              <TextField label="Stock Status" select value={form.stockStatus || 'normal'} onChange={(e) => setForm({ ...form, stockStatus: e.target.value })} fullWidth>
                {(options?.stockStatuses || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </>)}
            {dialogType === 'shipment' && (<>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Shipment Number" value={form.shipmentNumber || ''} onChange={(e) => setForm({ ...form, shipmentNumber: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Type" select value={form.shipmentType || 'outbound'} onChange={(e) => setForm({ ...form, shipmentType: e.target.value })} fullWidth>{(options?.shipmentTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Origin" value={form.origin || ''} onChange={(e) => setForm({ ...form, origin: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Destination" value={form.destination || ''} onChange={(e) => setForm({ ...form, destination: e.target.value })} fullWidth /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Carrier" value={form.carrier || ''} onChange={(e) => setForm({ ...form, carrier: e.target.value })} fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Ship Date" type="date" value={form.shipDate || ''} onChange={(e) => setForm({ ...form, shipDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}><TextField label="Items" type="number" value={form.totalItems || ''} onChange={(e) => setForm({ ...form, totalItems: parseInt(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Weight (kg)" type="number" value={form.totalWeight || ''} onChange={(e) => setForm({ ...form, totalWeight: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
                <Grid item xs={4}><TextField label="Cost" type="number" value={form.totalCost || ''} onChange={(e) => setForm({ ...form, totalCost: parseFloat(e.target.value) || 0 })} fullWidth /></Grid>
              </Grid>
            </>)}
            {dialogType === 'alert' && (<>
              <TextField label="Title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth required />
              <TextField label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Type" select value={form.alertType || 'stockout'} onChange={(e) => setForm({ ...form, alertType: e.target.value })} fullWidth>{(options?.alertTypes || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
                <Grid item xs={6}><TextField label="Severity" select value={form.severity || 'medium'} onChange={(e) => setForm({ ...form, severity: e.target.value })} fullWidth>{(options?.severities || []).map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}</TextField></Grid>
              </Grid>
              <TextField label="Recommended Action" value={form.recommendedAction || ''} onChange={(e) => setForm({ ...form, recommendedAction: e.target.value })} fullWidth multiline rows={2} />
              <TextField label="Impact Value" type="number" value={form.impactValue || ''} onChange={(e) => setForm({ ...form, impactValue: parseFloat(e.target.value) || 0 })} fullWidth />
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

export default SupplyChainManagement;
