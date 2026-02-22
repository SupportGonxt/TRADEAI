import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Tooltip, LinearProgress, Alert, Snackbar,
  Select, FormControl, InputLabel, alpha
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon, Add as AddIcon, Edit as EditIcon,
  Delete as DeleteIcon, CheckCircle as CheckIcon,
  Refresh as RefreshIcon, ChevronLeft, ChevronRight,
  EventNote as EventIcon, ErrorOutline as ConflictIcon, PieChart as CoverageIcon
} from '@mui/icons-material';
import { calendarHeatmapService } from '../../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const STATUS_COLORS = { draft: '#6B7280', planned: '#3B82F6', active: '#10B981', completed: '#8B5CF6', cancelled: '#EF4444' };

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function getHeatColor(count) {
  if (count === 0) return '#F3F4F6';
  if (count === 1) return '#DBEAFE';
  if (count === 2) return '#93C5FD';
  if (count === 3) return '#60A5FA';
  if (count <= 5) return '#3B82F6';
  return '#1D4ED8';
}

const SummaryCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{subtitle}</Typography>}
    </CardContent>
  </Card>
);

const emptyEvent = {
  title: '', eventType: 'promotion', promotionName: '', startDate: '', endDate: '',
  customerName: '', productName: '', category: '', brand: '', channel: '', region: '',
  mechanic: '', status: 'planned', budget: '', expectedLift: '', priority: 'medium',
  color: '#3B82F6', isRecurring: false, tags: '', notes: ''
};

export default function PromotionCalendarHeatmap() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [events, setEvents] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(emptyEvent);
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterStatus, setFilterStatus] = useState('');

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, optRes, evtRes, heatRes, confRes, covRes] = await Promise.all([
        calendarHeatmapService.getSummary().catch(() => ({ data: {} })),
        calendarHeatmapService.getOptions().catch(() => ({ data: {} })),
        calendarHeatmapService.getEvents({ limit: 200, ...(filterStatus ? { status: filterStatus } : {}) }).catch(() => ({ data: [] })),
        calendarHeatmapService.getHeatmap({ year, month: month + 1 }).catch(() => ({ data: {} })),
        calendarHeatmapService.getConflicts({ limit: 100 }).catch(() => ({ data: [] })),
        calendarHeatmapService.getCoverage({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data || sumRes);
      setOptions(optRes.data || optRes);
      setEvents(evtRes.data || evtRes.documents || []);
      setHeatmapData(heatRes.data || heatRes);
      setConflicts(confRes.data || confRes.documents || []);
      setCoverage(covRes.data || covRes.documents || []);
    } catch (e) {
      showMsg('Failed to load data', 'error');
    }
    setLoading(false);
  }, [year, month, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveEvent = async () => {
    try {
      const payload = { ...editData, budget: parseFloat(editData.budget) || 0, expectedLift: parseFloat(editData.expectedLift) || 0 };
      if (editId) {
        await calendarHeatmapService.updateEvent(editId, payload);
        showMsg('Event updated');
      } else {
        await calendarHeatmapService.createEvent(payload);
        showMsg('Event created');
      }
      setDialogOpen(false);
      setEditData(emptyEvent);
      setEditId(null);
      loadData();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await calendarHeatmapService.deleteEvent(id);
      showMsg('Event deleted');
      loadData();
    } catch (e) {
      showMsg('Delete failed', 'error');
    }
  };

  const handleEditEvent = (evt) => {
    setEditData({
      title: evt.title || '', eventType: evt.eventType || 'promotion', promotionName: evt.promotionName || '',
      startDate: evt.startDate || '', endDate: evt.endDate || '', customerName: evt.customerName || '',
      productName: evt.productName || '', category: evt.category || '', brand: evt.brand || '',
      channel: evt.channel || '', region: evt.region || '', mechanic: evt.mechanic || '',
      status: evt.status || 'planned', budget: evt.budget || '', expectedLift: evt.expectedLift || '',
      priority: evt.priority || 'medium', color: evt.color || '#3B82F6',
      isRecurring: evt.isRecurring || false, tags: evt.tags || '', notes: evt.notes || ''
    });
    setEditId(evt.id);
    setDialogOpen(true);
  };

  const handleResolveConflict = async (id) => {
    try {
      await calendarHeatmapService.updateConflict(id, { status: 'resolved', resolution: 'Manually resolved' });
      showMsg('Conflict resolved');
      loadData();
    } catch (e) {
      showMsg('Resolve failed', 'error');
    }
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthDays = getMonthDays(year, month);
  const dayEventMap = {};
  if (Array.isArray(events)) {
    events.forEach(evt => {
      if (!evt.startDate) return;
      const start = new Date(evt.startDate);
      const end = evt.endDate ? new Date(evt.endDate) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!dayEventMap[day]) dayEventMap[day] = [];
          dayEventMap[day].push(evt);
        }
      }
    });
  }

  const s = summary || {};

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Promotion Calendar Heatmap</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>Visual calendar with conflict detection and coverage analysis</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditData(emptyEvent); setEditId(null); setDialogOpen(true); }}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>New Event</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Events" value={s.totalEvents || 0} icon={<EventIcon />} color="#3B82F6" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Active Events" value={s.activeEvents || 0} icon={<CalendarIcon />} color="#10B981" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Open Conflicts" value={s.openConflicts || 0} icon={<ConflictIcon />} color="#EF4444" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Avg Coverage" value={`${s.avgCoverage || 0}%`} icon={<CoverageIcon />} color="#8B5CF6" /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Calendar Heatmap" icon={<CalendarIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Events" icon={<EventIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label={`Conflicts (${conflicts.length})`} icon={<ConflictIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Coverage" icon={<CoverageIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 2 }}>
            <IconButton onClick={prevMonth}><ChevronLeft /></IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 200, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </Typography>
            <IconButton onClick={nextMonth}><ChevronRight /></IconButton>
          </Box>

          <Grid container spacing={0.5} sx={{ mb: 1 }}>
            {DAYS_OF_WEEK.map(d => (
              <Grid item xs={12/7} key={d}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280', textAlign: 'center', display: 'block' }}>{d}</Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={0.5}>
            {monthDays.map((day, idx) => {
              const evts = day ? (dayEventMap[day] || []) : [];
              const count = evts.length;
              return (
                <Grid item xs={12/7} key={idx}>
                  <Tooltip title={day ? `${count} event${count !== 1 ? 's' : ''}` : ''} arrow>
                    <Box
                      sx={{
                        height: 80, borderRadius: 1.5, bgcolor: day ? getHeatColor(count) : 'transparent',
                        border: day ? '1px solid' : 'none', borderColor: count > 0 ? alpha('#3B82F6', 0.3) : '#E5E7EB',
                        p: 0.5, cursor: day && count > 0 ? 'pointer' : 'default', position: 'relative',
                        transition: 'all 0.2s', '&:hover': day ? { transform: 'scale(1.02)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } : {},
                      }}
                    >
                      {day && (
                        <>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: count > 3 ? '#fff' : '#374151', display: 'block' }}>{day}</Typography>
                          {evts.slice(0, 2).map((e, i) => (
                            <Box key={i} sx={{ fontSize: '0.6rem', bgcolor: alpha(e.color || '#3B82F6', 0.2), color: e.color || '#3B82F6',
                              borderRadius: 0.5, px: 0.5, mb: 0.25, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {e.title}
                            </Box>
                          ))}
                          {count > 2 && <Typography sx={{ fontSize: '0.55rem', color: count > 3 ? '#fff' : '#6B7280' }}>+{count - 2} more</Typography>}
                        </>
                      )}
                    </Box>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>Less</Typography>
            {[0, 1, 2, 3, 5, 7].map(c => (
              <Box key={c} sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: getHeatColor(c), border: '1px solid #E5E7EB' }} />
            ))}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>More</Typography>
          </Box>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} label="Status">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>{Array.isArray(events) ? events.length : 0} events</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!Array.isArray(events) || events.length === 0) ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No events found</TableCell></TableRow>
                ) : events.map(evt => (
                  <TableRow key={evt.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: evt.color || '#3B82F6' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{evt.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={evt.eventType || 'promotion'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{evt.startDate?.slice(0, 10)}</TableCell>
                    <TableCell>{evt.endDate?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Chip label={evt.status} size="small"
                        sx={{ bgcolor: alpha(STATUS_COLORS[evt.status] || '#6B7280', 0.1), color: STATUS_COLORS[evt.status] || '#6B7280', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={evt.priority} size="small"
                        sx={{ bgcolor: alpha(PRIORITY_COLORS[evt.priority] || '#6B7280', 0.1), color: PRIORITY_COLORS[evt.priority] || '#6B7280', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{evt.budget ? `R${Number(evt.budget).toLocaleString()}` : '-'}</TableCell>
                    <TableCell>{evt.channel || '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEditEvent(evt)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteEvent(evt.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Event A</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Event B</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Overlap</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!Array.isArray(conflicts) || conflicts.length === 0) ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No conflicts detected</TableCell></TableRow>
                ) : conflicts.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{c.eventATitle}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{c.eventBTitle}</Typography></TableCell>
                    <TableCell><Chip label={c.conflictType} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip label={c.severity} size="small"
                        sx={{ bgcolor: alpha(c.severity === 'high' ? '#EF4444' : c.severity === 'medium' ? '#F59E0B' : '#10B981', 0.1),
                          color: c.severity === 'high' ? '#EF4444' : c.severity === 'medium' ? '#F59E0B' : '#10B981', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{c.overlapDays ? `${c.overlapDays} days` : '-'}</TableCell>
                    <TableCell>
                      <Chip label={c.status} size="small"
                        sx={{ bgcolor: c.status === 'resolved' ? alpha('#10B981', 0.1) : alpha('#EF4444', 0.1),
                          color: c.status === 'resolved' ? '#10B981' : '#EF4444', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right">
                      {c.status !== 'resolved' && (
                        <Button size="small" variant="outlined" color="success" onClick={() => handleResolveConflict(c.id)} startIcon={<CheckIcon />}>
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Coverage Analysis</Typography>
          {(!Array.isArray(coverage) || coverage.length === 0) ? (
            <Typography sx={{ color: '#9CA3AF', textAlign: 'center', py: 4 }}>No coverage data available</Typography>
          ) : (
            <Grid container spacing={2}>
              {coverage.map(c => (
                <Grid item xs={12} sm={6} md={4} key={c.id}>
                  <Card sx={{ borderRadius: 2, border: '1px solid #E5E7EB' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{c.dimensionName || c.dimension}</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{c.analysisPeriod}</Typography>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">Coverage</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{c.coveragePct || 0}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={Math.min(c.coveragePct || 0, 100)}
                          sx={{ height: 8, borderRadius: 4, bgcolor: '#E5E7EB',
                            '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: c.coveragePct >= 80 ? '#10B981' : c.coveragePct >= 50 ? '#F59E0B' : '#EF4444' } }} />
                      </Box>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6B7280' }}>Events</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{c.eventCount || 0}</Typography></Grid>
                        <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6B7280' }}>Gaps</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{c.gapDays || 0}d</Typography></Grid>
                        <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6B7280' }}>Overlap</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{c.overlapDays || 0}d</Typography></Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Edit Event' : 'Create Event'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Title" value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Event Type" value={editData.eventType} onChange={e => setEditData(d => ({ ...d, eventType: e.target.value }))}>
                {['promotion','discount','bogo','seasonal','clearance','launch','trade_show','other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Promotion Name" value={editData.promotionName} onChange={e => setEditData(d => ({ ...d, promotionName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                {['draft','planned','active','completed','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Start Date" value={editData.startDate} onChange={e => setEditData(d => ({ ...d, startDate: e.target.value }))} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="End Date" value={editData.endDate} onChange={e => setEditData(d => ({ ...d, endDate: e.target.value }))} InputLabelProps={{ shrink: true }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Customer" value={editData.customerName} onChange={e => setEditData(d => ({ ...d, customerName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Product" value={editData.productName} onChange={e => setEditData(d => ({ ...d, productName: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Channel" value={editData.channel} onChange={e => setEditData(d => ({ ...d, channel: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Region" value={editData.region} onChange={e => setEditData(d => ({ ...d, region: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Priority" value={editData.priority} onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}>
                {['high','medium','low'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Budget (R)" value={editData.budget} onChange={e => setEditData(d => ({ ...d, budget: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Expected Lift %" value={editData.expectedLift} onChange={e => setEditData(d => ({ ...d, expectedLift: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Mechanic" value={editData.mechanic} onChange={e => setEditData(d => ({ ...d, mechanic: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Notes" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEvent} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
