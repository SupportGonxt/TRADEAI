import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Chip,
  CircularProgress, Alert, Card, CardContent
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  ArrowBack as BackIcon, Visibility as ViewIcon, Send as SendIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { retailerCollaborationService } from '../../services/api';

const statusColors = {
  active: 'success', inactive: 'default', suspended: 'error',
  draft: 'default', approved: 'success', rejected: 'error',
  pending: 'warning', expired: 'default', completed: 'info'
};

const formatCurrency = (v) => v != null ? `R ${Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00';
const formatPct = (v) => v != null ? `${Number(v).toFixed(1)}%` : '0.0%';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA') : '-';

const RetailerCollaborationPortal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [portals, setPortals] = useState([]);
  const [plans, setPlans] = useState([]);
  const [sharedPromos, setSharedPromos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [detail, setDetail] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('portal');
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [options, setOptions] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, optionsRes] = await Promise.all([
        retailerCollaborationService.getSummary(),
        retailerCollaborationService.getOptions()
      ]);
      setSummary(summaryRes.data);
      setOptions(optionsRes.data || {});

      if (id) {
        const portalRes = await retailerCollaborationService.getPortalById(id);
        setDetail(portalRes.data);
      } else {
        const [portalsRes, plansRes, promosRes, msgsRes] = await Promise.all([
          retailerCollaborationService.getPortals(),
          retailerCollaborationService.getPlans(),
          retailerCollaborationService.getSharedPromotions(),
          retailerCollaborationService.getMessages()
        ]);
        setPortals(portalsRes.data || []);
        setPlans(plansRes.data || []);
        setSharedPromos(promosRes.data || []);
        setMessages(msgsRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setFormData({});
    setDialogOpen(true);
  };

  const handleEdit = (type, item) => {
    setDialogType(type);
    setEditItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'portal') {
        if (editItem) await retailerCollaborationService.updatePortal(editItem.id, formData);
        else await retailerCollaborationService.createPortal(formData);
      } else if (dialogType === 'plan') {
        if (editItem) await retailerCollaborationService.updatePlan(editItem.id, formData);
        else await retailerCollaborationService.createPlan(formData);
      } else if (dialogType === 'shared') {
        if (editItem) await retailerCollaborationService.updateSharedPromotion(editItem.id, formData);
        else await retailerCollaborationService.createSharedPromotion(formData);
      } else if (dialogType === 'message') {
        await retailerCollaborationService.createMessage(formData);
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (type === 'portal') await retailerCollaborationService.deletePortal(itemId);
      else if (type === 'plan') await retailerCollaborationService.deletePlan(itemId);
      else if (type === 'shared') await retailerCollaborationService.deleteSharedPromotion(itemId);
      else if (type === 'message') await retailerCollaborationService.deleteMessage(itemId);
      loadData();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  if (id && detail) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/retailer-collaboration')} sx={{ mb: 2 }}>
          Back to Portals
        </Button>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{detail.retailerName}</Typography>
              <Typography color="text.secondary">{detail.retailerCode} | {detail.accessLevel}</Typography>
            </Box>
            <Chip label={detail.portalStatus} color={statusColors[detail.portalStatus] || 'default'} />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Contact</Typography><Typography>{detail.primaryContactName || '-'}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Email</Typography><Typography>{detail.primaryContactEmail || '-'}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Phone</Typography><Typography>{detail.primaryContactPhone || '-'}</Typography></Grid>
            <Grid item xs={12} md={3}><Typography variant="body2" color="text.secondary">Collaboration Score</Typography><Typography fontWeight={600}>{detail.collaborationScore || 0}/100</Typography></Grid>
          </Grid>
        </Paper>

        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Joint Business Plans</Typography>
        <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 3 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell>
              <TableCell align="right">Investment</TableCell><TableCell align="right">Projected Revenue</TableCell><TableCell>Period</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {(detail.plans || []).map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.planType || p.plan_type}</TableCell>
                  <TableCell><Chip label={p.status} size="small" color={statusColors[p.status] || 'default'} /></TableCell>
                  <TableCell align="right">{formatCurrency(p.totalInvestment || p.total_investment)}</TableCell>
                  <TableCell align="right">{formatCurrency(p.projectedRevenue || p.projected_revenue)}</TableCell>
                  <TableCell>{p.fiscalYear || p.fiscal_year} {p.quarter || ''}</TableCell>
                </TableRow>
              ))}
              {(!detail.plans || detail.plans.length === 0) && <TableRow><TableCell colSpan={6} align="center">No plans</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Shared Promotions</Typography>
        <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 3 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell>Promotion</TableCell><TableCell>Status</TableCell><TableCell>Visibility</TableCell>
              <TableCell>Shared Date</TableCell><TableCell>Rating</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {(detail.sharedPromotions || []).map(sp => (
                <TableRow key={sp.id} hover>
                  <TableCell>{sp.promotionName || sp.promotion_name}</TableCell>
                  <TableCell><Chip label={sp.shareStatus || sp.share_status} size="small" color={statusColors[sp.shareStatus || sp.share_status] || 'default'} /></TableCell>
                  <TableCell>{sp.visibility}</TableCell>
                  <TableCell>{formatDate(sp.sharedAt || sp.shared_at)}</TableCell>
                  <TableCell>{sp.retailerRating || sp.retailer_rating || '-'}/5</TableCell>
                </TableRow>
              ))}
              {(!detail.sharedPromotions || detail.sharedPromotions.length === 0) && <TableRow><TableCell colSpan={5} align="center">No shared promotions</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Messages</Typography>
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          {(detail.messages || []).map(m => (
            <Box key={m.id} sx={{ p: 1.5, mb: 1, bgcolor: m.senderType === 'manufacturer' ? '#F3E8FF' : '#F0FDF4', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600}>{m.senderName || m.senderType}</Typography>
                <Typography variant="caption" color="text.secondary">{formatDate(m.createdAt || m.created_at)}</Typography>
              </Box>
              {m.subject && <Typography variant="body2" fontWeight={500}>{m.subject}</Typography>}
              <Typography variant="body2">{m.body}</Typography>
            </Box>
          ))}
          {(!detail.messages || detail.messages.length === 0) && <Typography color="text.secondary" align="center">No messages</Typography>}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Retailer Collaboration Portal
          </Typography>
          <Typography color="text.secondary">Manage retailer partnerships, joint business plans, and shared promotions</Typography>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Retailer Portals</Typography>
                <Typography variant="h4" fontWeight={700}>{summary.portals?.total || 0}</Typography>
                <Typography variant="caption" color="success.main">{summary.portals?.active || 0} active</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Joint Plans</Typography>
                <Typography variant="h4" fontWeight={700}>{summary.plans?.total || 0}</Typography>
                <Typography variant="caption" color="success.main">{summary.plans?.active || 0} active</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Shared Promotions</Typography>
                <Typography variant="h4" fontWeight={700}>{summary.sharedPromotions?.total || 0}</Typography>
                <Typography variant="caption" color="warning.main">{summary.sharedPromotions?.pending || 0} pending</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Messages</Typography>
                <Typography variant="h4" fontWeight={700}>{summary.messages?.total || 0}</Typography>
                <Typography variant="caption" color="info.main">{summary.messages?.unread || 0} unread</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E5E7EB', px: 2 }}>
          <Tab label="Retailer Portals" />
          <Tab label="Joint Business Plans" />
          <Tab label="Shared Promotions" />
          <Tab label="Messages" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('portal')} sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                Add Retailer Portal
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell>Retailer</TableCell><TableCell>Code</TableCell><TableCell>Status</TableCell>
                  <TableCell>Access Level</TableCell><TableCell>Contact</TableCell>
                  <TableCell align="right">Score</TableCell><TableCell align="center">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {portals.map(p => (
                    <TableRow key={p.id} hover sx={{ cursor: 'pointer' }}>
                      <TableCell onClick={() => navigate(`/retailer-collaboration/${p.id}`)}><Typography fontWeight={600}>{p.retailerName}</Typography></TableCell>
                      <TableCell>{p.retailerCode || '-'}</TableCell>
                      <TableCell><Chip label={p.portalStatus} size="small" color={statusColors[p.portalStatus] || 'default'} /></TableCell>
                      <TableCell>{p.accessLevel}</TableCell>
                      <TableCell>{p.primaryContactName || '-'}</TableCell>
                      <TableCell align="right">{p.collaborationScore || 0}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => navigate(`/retailer-collaboration/${p.id}`)}><ViewIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleEdit('portal', p)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('portal', p.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {portals.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No retailer portals yet</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('plan')} sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                New Joint Plan
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell>Name</TableCell><TableCell>Retailer</TableCell><TableCell>Type</TableCell>
                  <TableCell>Status</TableCell><TableCell align="right">Investment</TableCell>
                  <TableCell align="right">Projected Revenue</TableCell><TableCell align="right">Growth</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography fontWeight={600}>{p.name}</Typography></TableCell>
                      <TableCell>{p.retailerName || '-'}</TableCell>
                      <TableCell>{p.planType}</TableCell>
                      <TableCell><Chip label={p.status} size="small" color={statusColors[p.status] || 'default'} /></TableCell>
                      <TableCell align="right">{formatCurrency(p.totalInvestment)}</TableCell>
                      <TableCell align="right">{formatCurrency(p.projectedRevenue)}</TableCell>
                      <TableCell align="right">{formatPct(p.projectedGrowthPct)}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEdit('plan', p)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('plan', p.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {plans.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No joint plans yet</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<ShareIcon />} onClick={() => handleCreate('shared')} sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                Share Promotion
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell>Promotion</TableCell><TableCell>Retailer</TableCell><TableCell>Status</TableCell>
                  <TableCell>Visibility</TableCell><TableCell>Shared Date</TableCell>
                  <TableCell>Rating</TableCell><TableCell align="center">Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {sharedPromos.map(sp => (
                    <TableRow key={sp.id} hover>
                      <TableCell><Typography fontWeight={600}>{sp.promotionName || '-'}</Typography></TableCell>
                      <TableCell>{sp.retailerName || '-'}</TableCell>
                      <TableCell><Chip label={sp.shareStatus} size="small" color={statusColors[sp.shareStatus] || 'default'} /></TableCell>
                      <TableCell>{sp.visibility}</TableCell>
                      <TableCell>{formatDate(sp.sharedAt)}</TableCell>
                      <TableCell>{sp.retailerRating || '-'}/5</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleEdit('shared', sp)}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete('shared', sp.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sharedPromos.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No shared promotions yet</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 3 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<SendIcon />} onClick={() => handleCreate('message')} sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                New Message
              </Button>
            </Box>
            {messages.map(m => (
              <Paper key={m.id} sx={{ p: 2, mb: 1, borderRadius: 2, bgcolor: m.senderType === 'manufacturer' ? '#F3E8FF' : '#F0FDF4' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{m.senderName || m.senderType}</Typography>
                    {m.subject && <Typography variant="body2" fontWeight={500}>{m.subject}</Typography>}
                    <Typography variant="body2">{m.body}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">{formatDate(m.createdAt)}</Typography>
                    <IconButton size="small" color="error" onClick={() => handleDelete('message', m.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
            {messages.length === 0 && <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No messages yet</Typography>}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editItem ? 'Edit' : 'Create'} {dialogType === 'portal' ? 'Retailer Portal' : dialogType === 'plan' ? 'Joint Business Plan' : dialogType === 'shared' ? 'Shared Promotion' : 'Message'}
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === 'portal' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Retailer Name" required fullWidth value={formData.retailerName || ''} onChange={(e) => setFormData({ ...formData, retailerName: e.target.value })} />
              <TextField label="Retailer Code" fullWidth value={formData.retailerCode || ''} onChange={(e) => setFormData({ ...formData, retailerCode: e.target.value })} />
              <TextField label="Access Level" select fullWidth value={formData.accessLevel || 'standard'} onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}>
                {(options.accessLevels || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField label="Status" select fullWidth value={formData.portalStatus || 'active'} onChange={(e) => setFormData({ ...formData, portalStatus: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </TextField>
              <TextField label="Contact Name" fullWidth value={formData.primaryContactName || ''} onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })} />
              <TextField label="Contact Email" fullWidth value={formData.primaryContactEmail || ''} onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })} />
              <TextField label="Contact Phone" fullWidth value={formData.primaryContactPhone || ''} onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })} />
              <TextField label="Notes" fullWidth multiline rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </Box>
          )}

          {dialogType === 'plan' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Plan Name" required fullWidth value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <TextField label="Description" fullWidth multiline rows={2} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <TextField label="Retailer Name" fullWidth value={formData.retailerName || ''} onChange={(e) => setFormData({ ...formData, retailerName: e.target.value })} />
              <TextField label="Plan Type" select fullWidth value={formData.planType || 'joint_business'} onChange={(e) => setFormData({ ...formData, planType: e.target.value })}>
                {(options.planTypes || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField label="Status" select fullWidth value={formData.status || 'draft'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Fiscal Year" fullWidth value={formData.fiscalYear || ''} onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField label="Quarter" fullWidth value={formData.quarter || ''} onChange={(e) => setFormData({ ...formData, quarter: e.target.value })} /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></Grid>
                <Grid item xs={6}><TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Total Investment" type="number" fullWidth value={formData.totalInvestment || ''} onChange={(e) => setFormData({ ...formData, totalInvestment: parseFloat(e.target.value) || 0 })} /></Grid>
                <Grid item xs={6}><TextField label="Projected Revenue" type="number" fullWidth value={formData.projectedRevenue || ''} onChange={(e) => setFormData({ ...formData, projectedRevenue: parseFloat(e.target.value) || 0 })} /></Grid>
              </Grid>
              <TextField label="Projected Growth %" type="number" fullWidth value={formData.projectedGrowthPct || ''} onChange={(e) => setFormData({ ...formData, projectedGrowthPct: parseFloat(e.target.value) || 0 })} />
              <TextField label="Notes" fullWidth multiline rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </Box>
          )}

          {dialogType === 'shared' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Promotion Name" required fullWidth value={formData.promotionName || ''} onChange={(e) => setFormData({ ...formData, promotionName: e.target.value })} />
              <TextField label="Retailer Name" fullWidth value={formData.retailerName || ''} onChange={(e) => setFormData({ ...formData, retailerName: e.target.value })} />
              <TextField label="Status" select fullWidth value={formData.shareStatus || 'pending'} onChange={(e) => setFormData({ ...formData, shareStatus: e.target.value })}>
                {(options.shareStatuses || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField label="Visibility" select fullWidth value={formData.visibility || 'full'} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}>
                {(options.visibilityLevels || []).map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField label="Manufacturer Notes" fullWidth multiline rows={2} value={formData.manufacturerNotes || ''} onChange={(e) => setFormData({ ...formData, manufacturerNotes: e.target.value })} />
            </Box>
          )}

          {dialogType === 'message' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="Subject" fullWidth value={formData.subject || ''} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
              <TextField label="Message" required fullWidth multiline rows={4} value={formData.body || ''} onChange={(e) => setFormData({ ...formData, body: e.target.value })} />
              <TextField label="Sender Name" fullWidth value={formData.senderName || ''} onChange={(e) => setFormData({ ...formData, senderName: e.target.value })} />
              <TextField label="Sender Type" select fullWidth value={formData.senderType || 'manufacturer'} onChange={(e) => setFormData({ ...formData, senderType: e.target.value })}>
                <MenuItem value="manufacturer">Manufacturer</MenuItem>
                <MenuItem value="retailer">Retailer</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RetailerCollaborationPortal;
