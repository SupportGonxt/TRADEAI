import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Snackbar, Tooltip,
  LinearProgress, TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Event as CalendarIcon,
  Block as BlockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  Sync as SyncIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { tradeCalendarService, customerService, productService, promotionService } from '../../services/api';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num.toFixed(0)}`;
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StatusChip = ({ status }) => {
  const colorMap = {
    draft: { bg: '#F3F4F6', color: '#6B7280' },
    planned: { bg: '#DBEAFE', color: '#2563EB' },
    approved: { bg: '#D1FAE5', color: '#059669' },
    active: { bg: '#EDE9FE', color: '#7C3AED' },
    completed: { bg: '#E0E7FF', color: '#4338CA' },
    cancelled: { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colorMap[status] || colorMap.draft;
  return (
    <Chip
      label={status?.charAt(0).toUpperCase() + status?.slice(1)}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};

const PriorityChip = ({ priority }) => {
  const colorMap = {
    low: { bg: '#F3F4F6', color: '#6B7280' },
    medium: { bg: '#FEF3C7', color: '#D97706' },
    high: { bg: '#FED7AA', color: '#EA580C' },
    critical: { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colorMap[priority] || colorMap.medium;
  return (
    <Chip
      label={priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};

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

const EMPTY_EVENT = {
  name: '', description: '', eventType: 'promotion', status: 'draft',
  startDate: '', endDate: '', allDay: true, color: '#7C3AED',
  customerId: '', customerName: '', productId: '', productName: '',
  promotionId: '', budgetId: '', channel: '', region: '', category: '', brand: '',
  plannedSpend: 0, plannedVolume: 0, plannedRevenue: 0,
  priority: 'medium', tags: '', notes: '',
};

const EMPTY_CONSTRAINT = {
  name: '', description: '', constraintType: 'blackout', status: 'active',
  scope: 'global', startDate: '', endDate: '', dayOfWeek: '',
  customerId: '', customerName: '', productId: '', productName: '',
  channel: '', region: '', category: '', brand: '',
  maxConcurrentPromotions: '', maxSpendAmount: '', minGapDays: 0,
  maxDiscountPct: '', minLeadTimeDays: 0,
  requireApproval: false, priority: 'medium', violationAction: 'warn', notes: '',
};

const TradeCalendarManagement = () => {
  const [tab, setTab] = useState(0);
  const [events, setEvents] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [eventDialog, setEventDialog] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [editingEventId, setEditingEventId] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  const [constraintDialog, setConstraintDialog] = useState(false);
  const [constraintForm, setConstraintForm] = useState(EMPTY_CONSTRAINT);
  const [editingConstraintId, setEditingConstraintId] = useState(null);

  const [violations, setViolations] = useState(null);

  const [sortField, setSortField] = useState('start_date');
  const [sortDir, setSortDir] = useState('asc');

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tradeCalendarService.getAll();
      setEvents(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConstraints = useCallback(async () => {
    try {
      const res = await tradeCalendarService.getConstraints();
      setConstraints(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load constraints', 'error');
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await tradeCalendarService.getSummary();
      setSummary(res.data || null);
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  }, []);

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await tradeCalendarService.getTimeline({ year: new Date().getFullYear() });
      setTimeline(res.data?.timeline || []);
    } catch (e) {
      console.error('Timeline fetch error:', e);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [optRes, custRes, prodRes, promoRes] = await Promise.all([
        tradeCalendarService.getOptions(),
        customerService.getAll({ limit: 500 }),
        productService.getAll({ limit: 500 }),
        promotionService.getAll({ limit: 500 }),
      ]);
      setOptions(optRes.data || null);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPromotions(promoRes.data || []);
    } catch (e) {
      console.error('Ref data fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchConstraints();
    fetchSummary();
    fetchTimeline();
    fetchRefData();
  }, [fetchEvents, fetchConstraints, fetchSummary, fetchTimeline, fetchRefData]);

  // Event CRUD
  const handleCreateEvent = () => {
    setEventForm(EMPTY_EVENT);
    setEditingEventId(null);
    setViolations(null);
    setEventDialog(true);
  };

  const handleEditEvent = async (ev) => {
    setEventForm({
      name: ev.name || '',
      description: ev.description || '',
      eventType: ev.eventType || ev.event_type || 'promotion',
      status: ev.status || 'draft',
      startDate: (ev.startDate || ev.start_date || '').split('T')[0],
      endDate: (ev.endDate || ev.end_date || '').split('T')[0],
      allDay: ev.allDay !== undefined ? ev.allDay : true,
      color: ev.color || '#7C3AED',
      customerId: ev.customerId || ev.customer_id || '',
      customerName: ev.customerName || ev.customer_name || '',
      productId: ev.productId || ev.product_id || '',
      productName: ev.productName || ev.product_name || '',
      promotionId: ev.promotionId || ev.promotion_id || '',
      budgetId: ev.budgetId || ev.budget_id || '',
      channel: ev.channel || '',
      region: ev.region || '',
      category: ev.category || '',
      brand: ev.brand || '',
      plannedSpend: ev.plannedSpend || ev.planned_spend || 0,
      plannedVolume: ev.plannedVolume || ev.planned_volume || 0,
      plannedRevenue: ev.plannedRevenue || ev.planned_revenue || 0,
      priority: ev.priority || 'medium',
      tags: ev.tags || '',
      notes: ev.notes || '',
    });
    setEditingEventId(ev.id);
    setViolations(null);
    setEventDialog(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (editingEventId) {
        await tradeCalendarService.update(editingEventId, eventForm);
        showSnack('Event updated');
      } else {
        await tradeCalendarService.create(eventForm);
        showSnack('Event created');
      }
      setEventDialog(false);
      fetchEvents();
      fetchSummary();
      fetchTimeline();
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this calendar event?')) return;
    try {
      await tradeCalendarService.delete(id);
      showSnack('Event deleted');
      fetchEvents();
      fetchSummary();
      fetchTimeline();
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleCheckConstraints = async () => {
    try {
      const res = await tradeCalendarService.checkConstraints(eventForm);
      setViolations(res.data || null);
    } catch (e) {
      showSnack(e.message || 'Constraint check failed', 'error');
    }
  };

  const handleSyncPromotion = async (id) => {
    try {
      await tradeCalendarService.syncPromotion(id);
      showSnack('Event synced from promotion');
      fetchEvents();
    } catch (e) {
      showSnack(e.message || 'Sync failed', 'error');
    }
  };

  const handleViewDetail = async (ev) => {
    try {
      const res = await tradeCalendarService.getById(ev.id);
      setDetailEvent(res.data || ev);
      setDetailDialog(true);
    } catch {
      setDetailEvent(ev);
      setDetailDialog(true);
    }
  };

  // Constraint CRUD
  const handleCreateConstraint = () => {
    setConstraintForm(EMPTY_CONSTRAINT);
    setEditingConstraintId(null);
    setConstraintDialog(true);
  };

  const handleEditConstraint = (ct) => {
    setConstraintForm({
      name: ct.name || '',
      description: ct.description || '',
      constraintType: ct.constraintType || ct.constraint_type || 'blackout',
      status: ct.status || 'active',
      scope: ct.scope || 'global',
      startDate: (ct.startDate || ct.start_date || '').split('T')[0],
      endDate: (ct.endDate || ct.end_date || '').split('T')[0],
      dayOfWeek: ct.dayOfWeek || ct.day_of_week || '',
      customerId: ct.customerId || ct.customer_id || '',
      customerName: ct.customerName || ct.customer_name || '',
      productId: ct.productId || ct.product_id || '',
      productName: ct.productName || ct.product_name || '',
      channel: ct.channel || '',
      region: ct.region || '',
      category: ct.category || '',
      brand: ct.brand || '',
      maxConcurrentPromotions: ct.maxConcurrentPromotions || ct.max_concurrent_promotions || '',
      maxSpendAmount: ct.maxSpendAmount || ct.max_spend_amount || '',
      minGapDays: ct.minGapDays || ct.min_gap_days || 0,
      maxDiscountPct: ct.maxDiscountPct || ct.max_discount_pct || '',
      minLeadTimeDays: ct.minLeadTimeDays || ct.min_lead_time_days || 0,
      requireApproval: ct.requireApproval || ct.require_approval || false,
      priority: ct.priority || 'medium',
      violationAction: ct.violationAction || ct.violation_action || 'warn',
      notes: ct.notes || '',
    });
    setEditingConstraintId(ct.id);
    setConstraintDialog(true);
  };

  const handleSaveConstraint = async () => {
    try {
      if (editingConstraintId) {
        await tradeCalendarService.updateConstraint(editingConstraintId, constraintForm);
        showSnack('Constraint updated');
      } else {
        await tradeCalendarService.createConstraint(constraintForm);
        showSnack('Constraint created');
      }
      setConstraintDialog(false);
      fetchConstraints();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDeleteConstraint = async (id) => {
    if (!window.confirm('Delete this constraint?')) return;
    try {
      await tradeCalendarService.deleteConstraint(id);
      showSnack('Constraint deleted');
      fetchConstraints();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleCustomerSelect = (id, formSetter) => {
    const cust = customers.find(c => c.id === id);
    formSetter(prev => ({ ...prev, customerId: id, customerName: cust?.name || '' }));
  };

  const handleProductSelect = (id, formSetter) => {
    const prod = products.find(p => p.id === id);
    formSetter(prev => ({ ...prev, productId: id, productName: prod?.name || '' }));
  };

  const handleSort = (field) => {
    setSortDir(sortField === field && sortDir === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedEvents = [...events].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const eventTypes = options?.eventTypes || [];
  const constraintTypes = options?.constraintTypes || [];
  const scopes = options?.scopes || [];
  const priorities = options?.priorities || [];
  const violationActions = options?.violationActions || [];
  const statuses = options?.statuses || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Trade Calendar & Constraints
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Plan promotional activities, enforce business rules, and prevent scheduling conflicts
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchEvents(); fetchConstraints(); fetchSummary(); fetchTimeline(); }}
            sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Refresh
          </Button>
          {tab === 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateEvent}
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
              New Event
            </Button>
          )}
          {tab === 2 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateConstraint}
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
              New Constraint
            </Button>
          )}
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Total Events" value={summary?.events?.total || 0}
            subtitle={`${summary?.events?.active || 0} active`}
            icon={<CalendarIcon />} color="#7C3AED" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Upcoming" value={summary?.events?.upcoming || 0}
            subtitle="planned / approved"
            icon={<TimelineIcon />} color="#2563EB" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Planned Spend" value={formatCurrency(summary?.events?.totalPlannedSpend)}
            subtitle={`Actual: ${formatCurrency(summary?.events?.totalActualSpend)}`}
            icon={<CalendarIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Active Constraints" value={summary?.constraints?.active || 0}
            subtitle={`${summary?.constraints?.blackouts || 0} blackouts`}
            icon={<BlockIcon />} color="#DC2626" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
        <Tab label={`Calendar Events (${events.length})`} />
        <Tab label="Timeline View" />
        <Tab label={`Constraints (${constraints.length})`} />
      </Tabs>

      {/* TAB 0: Calendar Events */}
      {tab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>
                  <TableSortLabel active={sortField === 'name'} direction={sortField === 'name' ? sortDir : 'asc'} onClick={() => handleSort('name')}>Name</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>
                  <TableSortLabel active={sortField === 'start_date'} direction={sortField === 'start_date' ? sortDir : 'asc'} onClick={() => handleSort('start_date')}>Dates</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Planned Spend</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                    No calendar events yet. Click "New Event" to create one.
                  </TableCell>
                </TableRow>
              ) : sortedEvents.map((ev) => {
                const typeInfo = eventTypes.find(t => t.value === (ev.eventType || ev.event_type));
                return (
                  <TableRow key={ev.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ev.color || typeInfo?.color || '#7C3AED', flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={typeInfo?.label || (ev.eventType || ev.event_type)} size="small"
                        sx={{ bgcolor: `${typeInfo?.color || '#7C3AED'}20`, color: typeInfo?.color || '#7C3AED', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#374151' }}>
                        {formatDate(ev.startDate || ev.start_date)} — {formatDate(ev.endDate || ev.end_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#374151' }}>
                        {ev.customerName || ev.customer_name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell><StatusChip status={ev.status} /></TableCell>
                    <TableCell><PriorityChip priority={ev.priority} /></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(ev.plannedSpend || ev.planned_spend)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View"><IconButton size="small" onClick={() => handleViewDetail(ev)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditEvent(ev)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      {(ev.promotionId || ev.promotion_id) && (
                        <Tooltip title="Sync from Promotion"><IconButton size="small" onClick={() => handleSyncPromotion(ev.id)}><SyncIcon fontSize="small" /></IconButton></Tooltip>
                      )}
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteEvent(ev.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 1: Timeline View */}
      {tab === 1 && (
        <Box>
          {timeline.length === 0 ? (
            <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No timeline data for {new Date().getFullYear()}</Typography>
            </Card>
          ) : timeline.map((month) => (
            <Card key={month.month} sx={{ borderRadius: 3, mb: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{month.label}</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip label={`${month.count} events`} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED' }} />
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                      Spend: {formatCurrency(month.totalPlannedSpend)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {month.events.map((ev) => {
                    const typeInfo = eventTypes.find(t => t.value === (ev.eventType || ev.event_type));
                    return (
                      <Box key={ev.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: '#F9FAFB', '&:hover': { bgcolor: '#F3F4F6' } }}>
                        <Box sx={{ width: 4, height: 32, borderRadius: 1, bgcolor: ev.color || typeInfo?.color || '#7C3AED' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{ev.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {formatDate(ev.startDate || ev.start_date)} — {formatDate(ev.endDate || ev.end_date)}
                            {(ev.customerName || ev.customer_name) ? ` | ${ev.customerName || ev.customer_name}` : ''}
                          </Typography>
                        </Box>
                        <StatusChip status={ev.status} />
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                          {formatCurrency(ev.plannedSpend || ev.planned_spend)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* TAB 2: Constraints */}
      {tab === 2 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Scope</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Dates</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {constraints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                    No constraints defined. Click "New Constraint" to add one.
                  </TableCell>
                </TableRow>
              ) : constraints.map((ct) => {
                const typeInfo = constraintTypes.find(t => t.value === (ct.constraintType || ct.constraint_type));
                return (
                  <TableRow key={ct.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{ct.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={typeInfo?.label || (ct.constraintType || ct.constraint_type)} size="small"
                        sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ct.scope}</Typography>
                    </TableCell>
                    <TableCell>
                      {(ct.startDate || ct.start_date) ? (
                        <Typography variant="caption">
                          {formatDate(ct.startDate || ct.start_date)} — {formatDate(ct.endDate || ct.end_date)}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell><StatusChip status={ct.status} /></TableCell>
                    <TableCell><PriorityChip priority={ct.priority} /></TableCell>
                    <TableCell>
                      <Chip label={ct.violationAction || ct.violation_action || 'warn'} size="small"
                        sx={{
                          bgcolor: (ct.violationAction || ct.violation_action) === 'block' ? '#FEE2E2' : '#FEF3C7',
                          color: (ct.violationAction || ct.violation_action) === 'block' ? '#DC2626' : '#D97706',
                          fontWeight: 500, fontSize: '0.7rem'
                        }} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditConstraint(ct)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteConstraint(ct.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Event Create/Edit Dialog */}
      <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingEventId ? 'Edit Calendar Event' : 'New Calendar Event'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth size="small" label="Event Name" required
                value={eventForm.name} onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Event Type"
                value={eventForm.eventType} onChange={(e) => {
                  const type = eventTypes.find(t => t.value === e.target.value);
                  setEventForm(prev => ({ ...prev, eventType: e.target.value, color: type?.color || prev.color }));
                }}>
                {eventTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2}
                value={eventForm.description} onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Start Date" type="date" InputLabelProps={{ shrink: true }} required
                value={eventForm.startDate} onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="End Date" type="date" InputLabelProps={{ shrink: true }} required
                value={eventForm.endDate} onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Status"
                value={eventForm.status} onChange={(e) => setEventForm(prev => ({ ...prev, status: e.target.value }))}>
                {statuses.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Priority"
                value={eventForm.priority} onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value }))}>
                {priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Customer"
                value={eventForm.customerId} onChange={(e) => handleCustomerSelect(e.target.value, setEventForm)}>
                <MenuItem value="">None</MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Product"
                value={eventForm.productId} onChange={(e) => handleProductSelect(e.target.value, setEventForm)}>
                <MenuItem value="">None</MenuItem>
                {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Link to Promotion"
                value={eventForm.promotionId} onChange={(e) => setEventForm(prev => ({ ...prev, promotionId: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {promotions.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Channel"
                value={eventForm.channel} onChange={(e) => setEventForm(prev => ({ ...prev, channel: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Region"
                value={eventForm.region} onChange={(e) => setEventForm(prev => ({ ...prev, region: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Planned Spend (R)" type="number"
                value={eventForm.plannedSpend} onChange={(e) => setEventForm(prev => ({ ...prev, plannedSpend: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Planned Volume" type="number"
                value={eventForm.plannedVolume} onChange={(e) => setEventForm(prev => ({ ...prev, plannedVolume: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Planned Revenue (R)" type="number"
                value={eventForm.plannedRevenue} onChange={(e) => setEventForm(prev => ({ ...prev, plannedRevenue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={eventForm.notes} onChange={(e) => setEventForm(prev => ({ ...prev, notes: e.target.value }))} />
            </Grid>
          </Grid>

          {violations && (
            <Box sx={{ mt: 2 }}>
              {violations.valid ? (
                <Alert severity="success" icon={<CheckIcon />}>No constraint violations found</Alert>
              ) : (
                <Box>
                  <Alert severity={violations.blocked ? 'error' : 'warning'} icon={violations.blocked ? <BlockIcon /> : <WarningIcon />}>
                    {violations.totalViolations} violation(s) found ({violations.blockers} blockers, {violations.warnings} warnings)
                  </Alert>
                  {violations.violations.map((v, i) => (
                    <Alert key={i} severity={v.action === 'block' ? 'error' : 'warning'} sx={{ mt: 1 }}>
                      <strong>{v.constraintName}</strong>: {v.message}
                    </Alert>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCheckConstraints} startIcon={<WarningIcon />}
            sx={{ color: '#D97706', mr: 'auto' }}>
            Check Constraints
          </Button>
          <Button onClick={() => setEventDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEvent}
            disabled={!eventForm.name || !eventForm.startDate || !eventForm.endDate}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingEventId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Constraint Create/Edit Dialog */}
      <Dialog open={constraintDialog} onClose={() => setConstraintDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingConstraintId ? 'Edit Constraint' : 'New Constraint'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={8}>
              <TextField fullWidth size="small" label="Constraint Name" required
                value={constraintForm.name} onChange={(e) => setConstraintForm(prev => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Type"
                value={constraintForm.constraintType} onChange={(e) => setConstraintForm(prev => ({ ...prev, constraintType: e.target.value }))}>
                {constraintTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2}
                value={constraintForm.description} onChange={(e) => setConstraintForm(prev => ({ ...prev, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Scope"
                value={constraintForm.scope} onChange={(e) => setConstraintForm(prev => ({ ...prev, scope: e.target.value }))}>
                {scopes.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Priority"
                value={constraintForm.priority} onChange={(e) => setConstraintForm(prev => ({ ...prev, priority: e.target.value }))}>
                {priorities.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Violation Action"
                value={constraintForm.violationAction} onChange={(e) => setConstraintForm(prev => ({ ...prev, violationAction: e.target.value }))}>
                {violationActions.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Start Date" type="date" InputLabelProps={{ shrink: true }}
                value={constraintForm.startDate} onChange={(e) => setConstraintForm(prev => ({ ...prev, startDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="End Date" type="date" InputLabelProps={{ shrink: true }}
                value={constraintForm.endDate} onChange={(e) => setConstraintForm(prev => ({ ...prev, endDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Max Concurrent Promos" type="number"
                value={constraintForm.maxConcurrentPromotions} onChange={(e) => setConstraintForm(prev => ({ ...prev, maxConcurrentPromotions: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Max Spend (R)" type="number"
                value={constraintForm.maxSpendAmount} onChange={(e) => setConstraintForm(prev => ({ ...prev, maxSpendAmount: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Min Gap (days)" type="number"
                value={constraintForm.minGapDays} onChange={(e) => setConstraintForm(prev => ({ ...prev, minGapDays: parseInt(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Max Discount (%)" type="number"
                value={constraintForm.maxDiscountPct} onChange={(e) => setConstraintForm(prev => ({ ...prev, maxDiscountPct: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Min Lead Time (days)" type="number"
                value={constraintForm.minLeadTimeDays} onChange={(e) => setConstraintForm(prev => ({ ...prev, minLeadTimeDays: parseInt(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Status"
                value={constraintForm.status} onChange={(e) => setConstraintForm(prev => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>
            {constraintForm.scope !== 'global' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth size="small" label="Customer"
                    value={constraintForm.customerId} onChange={(e) => handleCustomerSelect(e.target.value, setConstraintForm)}>
                    <MenuItem value="">None</MenuItem>
                    {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth size="small" label="Product"
                    value={constraintForm.productId} onChange={(e) => handleProductSelect(e.target.value, setConstraintForm)}>
                    <MenuItem value="">None</MenuItem>
                    {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </TextField>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={constraintForm.notes} onChange={(e) => setConstraintForm(prev => ({ ...prev, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConstraintDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveConstraint}
            disabled={!constraintForm.name}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingConstraintId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Event Details
        </DialogTitle>
        <DialogContent dividers>
          {detailEvent && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{detailEvent.name}</Typography>
                {detailEvent.description && (
                  <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>{detailEvent.description}</Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                <StatusChip status={detailEvent.status} />
                <Box sx={{ mt: 1 }}><PriorityChip priority={detailEvent.priority} /></Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {eventTypes.find(t => t.value === (detailEvent.eventType || detailEvent.event_type))?.label || detailEvent.eventType || detailEvent.event_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Start Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(detailEvent.startDate || detailEvent.start_date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>End Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(detailEvent.endDate || detailEvent.end_date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Customer</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detailEvent.customerName || detailEvent.customer_name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Planned Spend</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(detailEvent.plannedSpend || detailEvent.planned_spend)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Actual Spend</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(detailEvent.actualSpend || detailEvent.actual_spend)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Planned Revenue</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(detailEvent.plannedRevenue || detailEvent.planned_revenue)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Actual Revenue</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(detailEvent.actualRevenue || detailEvent.actual_revenue)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>ROI</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{(detailEvent.roi || 0).toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Lift</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{(detailEvent.liftPct || detailEvent.lift_pct || 0).toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Channel</Typography>
                <Typography variant="body2">{detailEvent.channel || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Region</Typography>
                <Typography variant="body2">{detailEvent.region || '-'}</Typography>
              </Grid>
              {detailEvent.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Notes</Typography>
                  <Typography variant="body2">{detailEvent.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setDetailDialog(false); handleEditEvent(detailEvent); }}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Edit
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

export default TradeCalendarManagement;
