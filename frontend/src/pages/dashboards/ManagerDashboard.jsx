import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
  LinearProgress,
  alpha,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MonetizationOn,
  TrendingDown,
  ShowChart,
  AttachMoney,
  ArrowUpward,
  ArrowDownward,
  MoreHoriz,
  FilterList,
  Fullscreen,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DecisionCard from '../../components/decision/DecisionCard';
import api, { analyticsService } from '../../services/api';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    budgetRecommendations: [],
    portfolioKPIs: {
      totalReallocation: 0,
      expectedRevenueGain: 0,
      underperformingCount: 0,
      highPerformingCount: 0
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        api.get('/dashboard').then(r => r.data).catch(() => null),
        analyticsService.getDashboard().catch(() => null),
      ]);

      if (dashRes?.success) {
        setLiveData(dashRes.data);
      }

      const budgetData = dashRes?.data?.budget || {};
      const analyticsData = analyticsRes?.data || {};
      const remaining = budgetData.remaining || (analyticsData.totalBudget - analyticsData.totalSpend) || 0;
      const promoCount = analyticsData.promotionCount || 0;
      const activePromos = analyticsData.activePromotions || 0;

      setDashboardData({
        budgetRecommendations: [],
        portfolioKPIs: {
          totalReallocation: remaining,
          expectedRevenueGain: remaining > 0 ? Math.round(remaining * 0.12) : 0,
          underperformingCount: Math.max(0, promoCount - activePromos),
          highPerformingCount: activePromos
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData({
        budgetRecommendations: [],
        portfolioKPIs: {
          totalReallocation: 0,
          expectedRevenueGain: 0,
          underperformingCount: 0,
          highPerformingCount: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReallocation = (recommendation) => {
    console.log('Apply reallocation:', recommendation);
  };

  const handleSimulateReallocation = (recommendation) => {
    navigate('/scenarios', { state: { recommendation } });
  };

  const handleExplainReallocation = (recommendation) => {
    console.log('Explain reallocation:', recommendation);
  };

  const overview = liveData?.overview || {};
  const budget = liveData?.budget || {};
  const recentActivity = liveData?.recentActivity || [];

  const budgetUtil = budget.total ? ((budget.utilized / budget.total) * 100).toFixed(0) : budget.utilizationRate || 0;

  const tabLabels = ['Overview', 'Activity', 'Timeline', 'Report'];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {tabLabels.map((label, idx) => (
          <Button
            key={label}
            onClick={() => setActiveTab(idx)}
            sx={{
              px: { xs: 2, sm: 3 },
              py: 1,
              borderRadius: '24px',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              textTransform: 'none',
              bgcolor: activeTab === idx ? '#7C3AED' : '#fff',
              color: activeTab === idx ? '#fff' : '#6B7280',
              border: activeTab === idx ? 'none' : '1px solid #E5E7EB',
              boxShadow: activeTab === idx ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
              '&:hover': {
                bgcolor: activeTab === idx ? '#6D28D9' : '#F9FAFB',
              },
            }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    Sales Target
                  </Typography>
                </Box>
                <Box display="flex" gap={0.5}>
                  <Chip label="All" size="small" sx={{ bgcolor: '#F3F4F6', fontWeight: 600, fontSize: '0.7rem', height: 24 }} />
                  <IconButton size="small"><MoreHoriz sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small"><Fullscreen sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small"><FilterList sx={{ fontSize: 18 }} /></IconButton>
                </Box>
              </Box>

              <Box display="flex" alignItems="baseline" gap={1} mb={1}>
                <Typography variant="h2" fontWeight={800} sx={{ color: '#111827', fontSize: { xs: '2rem', sm: '3rem' } }}>
                  %{budgetUtil}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Better Than Last Month
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                {['Promotions', 'Budgets', 'Spend'].map((label, i) => (
                  <Box key={label} sx={{ flex: 1, textAlign: 'center' }}>
                    <Box
                      sx={{
                        height: 80,
                        borderRadius: '12px',
                        bgcolor: i === 0 ? 'rgba(124,58,237,0.15)' : i === 1 ? 'rgba(59,130,246,0.12)' : 'rgba(251,146,60,0.15)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        pb: 0.5,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: '60%',
                          height: `${30 + (i + 1) * 15}%`,
                          borderRadius: '8px 8px 0 0',
                          bgcolor: i === 0 ? '#7C3AED' : i === 1 ? '#7C3AED' : '#FB923C',
                          opacity: 0.8,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: '#F9FAFB', borderRadius: '10px', p: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                <Typography variant="caption" color="text.secondary">
                  Period: {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })} - {new Date(Date.now() + 30*86400000).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Recent Activity</Typography>
                <IconButton size="small" onClick={() => navigate('/trade-spends')}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 14, color: '#6B7280' }}>&#8599;</Typography>
                  </Box>
                </IconButton>
              </Box>

              <Box display="flex" gap={2} mb={2}>
                <Chip
                  icon={<ArrowUpward sx={{ fontSize: 14, color: '#10B981 !important' }} />}
                  label="Incoming"
                  size="small"
                  sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '0.7rem' }}
                />
                <Chip
                  icon={<ArrowDownward sx={{ fontSize: 14, color: '#EF4444 !important' }} />}
                  label="Outgoing"
                  size="small"
                  sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>

              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5}>
                Recent Trade Spends
              </Typography>
              {recentActivity.slice(0, 3).map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: idx < 2 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: item.status === 'approved' ? '#ECFDF5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: 18 }}>{item.spendType === 'rebate' ? '💰' : item.spendType === 'promotional' ? '📣' : '📋'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        {item.spendId || item.activityType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {item.spendType} · {item.status}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: item.status === 'approved' ? '#059669' : '#111827' }}>
                    R{(item.amount || 0).toLocaleString()}
                  </Typography>
                </Box>
              ))}

              {recentActivity.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                </Box>
              )}

              <Typography variant="body2" fontWeight={600} color="text.secondary" mt={2} mb={1.5}>
                Pending Actions
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 18 }}>⏳</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                      Pending Approvals
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {overview.pendingApprovals || 0} items waiting
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/approvals')}
                  sx={{ color: '#7C3AED', fontWeight: 600, fontSize: '0.75rem', textTransform: 'none' }}
                >
                  Review
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                height: '100%',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight={700}>Budget Goals</Typography>
                <IconButton size="small"><MoreHoriz sx={{ fontSize: 18 }} /></IconButton>
              </Box>

              <Box sx={{ bgcolor: '#FEFCE8', borderRadius: '14px', p: 2, mb: 2, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem' }}>
                      Annual Budget
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target · {budgetUtil}% utilized
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(Number(budgetUtil), 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#FDE68A',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                      },
                    }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={1.5}>
                  <Typography variant="h5" fontWeight={800} color="text.primary">
                    R{((budget.utilized || 0) / 1000000).toFixed(1)}M
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    /R{((budget.total || 0) / 1000000).toFixed(1)}M
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                Key Metrics
              </Typography>
              {[
                { label: 'Total Customers', value: overview.totalCustomers || 0, color: '#7C3AED' },
                { label: 'Active Promotions', value: overview.activePromotions || 0, color: '#7C3AED' },
                { label: 'Total Products', value: overview.totalProducts || 0, color: '#10B981' },
              ].map((metric, idx) => (
                <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" sx={{ py: 1.25, borderBottom: idx < 2 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: metric.color }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{metric.label}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>{metric.value}</Typography>
                </Box>
              ))}

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                  Quick Navigation
                </Typography>
                {[
                  { label: 'Budget Console', path: '/budget-console' },
                  { label: 'Forecasting', path: '/forecasting' },
                ].map((link, idx) => (
                  <Box
                    key={idx}
                    onClick={() => navigate(link.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      cursor: 'pointer',
                      '&:hover': { '& .nav-label': { color: '#7C3AED' } },
                    }}
                  >
                    <Typography className="nav-label" variant="body2" fontWeight={500} sx={{ transition: 'color 0.15s' }}>
                      {link.label}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: '#9CA3AF' }}>&#8250;</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                  <Typography variant="subtitle2" fontWeight={700}>Portfolio Analysis</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Tabs
                    value={0}
                    sx={{
                      minHeight: 32,
                      '& .MuiTab-root': { minHeight: 32, py: 0.5, px: 2, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' },
                      '& .MuiTabs-indicator': { height: 2 },
                    }}
                  >
                    <Tab label="Sales" />
                    <Tab label="Insight" />
                  </Tabs>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {[
                  { label: 'Reallocation Opportunity', value: `R${(Number(dashboardData.portfolioKPIs.totalReallocation || 0) / 1000).toFixed(1)}K`, icon: <MonetizationOn />, color: '#7C3AED', sub: 'Available to optimize' },
                  { label: 'Expected Revenue Gain', value: `R${(Number(dashboardData.portfolioKPIs.expectedRevenueGain || 0) / 1000).toFixed(1)}K`, icon: <AttachMoney />, color: '#10B981', sub: 'Projected uplift' },
                  { label: 'Underperforming', value: dashboardData.portfolioKPIs.underperformingCount || 0, icon: <TrendingDown />, color: '#EF4444', sub: 'Need attention' },
                  { label: 'High Performing', value: dashboardData.portfolioKPIs.highPerformingCount || 0, icon: <ShowChart />, color: '#10B981', sub: 'Exceeding targets' },
                ].map((kpi, idx) => (
                  <Grid item xs={6} md={3} key={idx}>
                    <Box sx={{ textAlign: 'center', p: 1.5 }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: alpha(kpi.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                        {React.cloneElement(kpi.icon, { sx: { color: kpi.color, fontSize: 22 } })}
                      </Box>
                      <Typography variant="h6" fontWeight={700}>{kpi.value}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{kpi.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: alpha('#7C3AED', 0.1), display: 'flex' }}>
                    <MonetizationOn sx={{ color: '#7C3AED', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>AI Recommendations</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dashboardData.budgetRecommendations.length} opportunities
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {dashboardData.budgetRecommendations.length === 0 ? (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius: '12px',
                    bgcolor: '#ECFDF5',
                    '& .MuiAlert-icon': { color: '#059669' },
                  }}
                >
                  All budgets optimally allocated.
                </Alert>
              ) : (
                dashboardData.budgetRecommendations.slice(0, 3).map((rec, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <DecisionCard
                      title={rec.type === 'reallocate'
                        ? `Reallocate from ${rec.from.promotionName} to ${rec.to.promotionName}`
                        : `Reduce spend on ${rec.from.promotionName}`
                      }
                      description={rec.reasoning}
                      impact={{
                        delta: rec.expectedImpact.revenueGain || rec.expectedImpact.savingsRealized || 0,
                        baseline: rec.from.currentSpend
                      }}
                      roi={rec.to ? rec.to.currentROI : rec.from.currentROI}
                      confidence={rec.confidence}
                      hierarchy={[
                        { type: 'From', name: rec.from.promotionName, level: 1 },
                        ...(rec.to ? [{ type: 'To', name: rec.to.promotionName, level: 1 }] : [])
                      ]}
                      priority={rec.priority}
                      risks={rec.from.currentROI < 50 ? [
                        { level: 'high', message: `Low ROI (${Number(rec.from.currentROI || 0).toFixed(1)}%) on source promotion` }
                      ] : []}
                      onSimulate={() => handleSimulateReallocation(rec)}
                      onApply={() => handleApplyReallocation(rec)}
                      onExplain={() => handleExplainReallocation(rec)}
                    />
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ManagerDashboard;
