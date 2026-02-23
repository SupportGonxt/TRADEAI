import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  MenuItem
} from '@mui/material';
import {
  Add,
  Refresh,
  TrendingUp,
  AttachMoney,
  CheckCircle,
  ShowChart
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DecisionCard from '../../components/decision/DecisionCard';
import simulationService from '../../services/simulation/simulationService';
import budgetService from '../../services/budget/budgetService';
import { useToast } from '../../components/common/ToastNotification';
import analytics from '../../utils/analytics';

const BudgetConsole = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);


  const [reallocationSuggestions, setReallocationSuggestions] = useState([]);
  const [roiCurve, setRoiCurve] = useState(null);
  const [period, setPeriod] = useState('2025-Q4');

  useEffect(() => {
    loadBudgets();
  }, [period]);

  useEffect(() => {
    if (selectedBudget) {
      loadReallocationSuggestions();
      loadRoiCurve();
    }
  }, [selectedBudget]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const startTime = Date.now();
      const response = await budgetService.getBudgets({ period });
      const budgetsData = response.budgets || response.data || response;
      const budgetsArray = Array.isArray(budgetsData) ? budgetsData : [budgetsData];
      
      setBudgets(budgetsArray);
      if (budgetsArray.length > 0) {
        setSelectedBudget(budgetsArray[0]);
      }

      analytics.trackPageView('budget_console', {
        period,
        budgetCount: budgetsArray.length,
        loadTime: Date.now() - startTime
      });
    } catch (error) {
      console.error('Failed to load budgets:', error);
      toast.error('Failed to load budgets. Please try again.');
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReallocationSuggestions = async () => {
    try {
      const response = await simulationService.reallocateBudget({
        budgetId: selectedBudget.id,
        constraints: {
          minROI: 2.0,
          maxReallocation: 0.2
        }
      });

      setReallocationSuggestions(response.recommendations || []);
    } catch (error) {
      console.error('Failed to load reallocation suggestions:', error);
    }
  };

  const loadRoiCurve = async () => {
    try {
      const mockCurve = {
        points: [
          { budget: 0, roi: 0 },
          { budget: 100000, roi: 3.2 },
          { budget: 200000, roi: 2.8 },
          { budget: 300000, roi: 2.5 },
          { budget: 400000, roi: 2.2 },
          { budget: 500000, roi: 2.0 },
          { budget: 600000, roi: 1.7 }
        ],
        optimal: 250000,
        currentROI: 2.3
      };

      setRoiCurve(mockCurve);
    } catch (error) {
      console.error('Failed to load ROI curve:', error);
    }
  };

  const handleApplyReallocation = async (suggestion) => {
    if (window.confirm(`Apply reallocation: ${suggestion.description}?`)) {
      try {
        await budgetService.applyReallocation(suggestion);
        toast.success('Reallocation applied successfully');
        await loadBudgets();
        analytics.trackEvent('budget_reallocation_applied', { suggestionId: suggestion.id });
      } catch (error) {
        console.error('Failed to apply reallocation:', error);
        toast.error('Failed to apply reallocation');
      }
    }
  };

  const handleSimulateReallocation = async (suggestion) => {
    try {
      const result = await simulationService.simulateReallocation(suggestion);
      toast.info(`Simulation: Expected ROI improvement of ${(result.expectedROIImprovement * 100).toFixed(1)}%`);
      analytics.trackEvent('budget_reallocation_simulated', { suggestionId: suggestion.id });
    } catch (error) {
      console.error('Failed to simulate reallocation:', error);
      toast.error('Failed to simulate reallocation');
    }
  };

  const renderHierarchyBudget = (node, depth = 0) => {
    const utilizationRate = node.allocated > 0 ? node.spent / node.allocated : 0;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <Box key={node.id}>
        <Paper 
          sx={{ 
            p: 2, 
            mb: 1, 
            ml: depth * 3,
            borderLeft: 3,
            borderColor: node.roi >= 2.0 ? 'success.main' : 'warning.main'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {node.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={`ROI: ${node.roi.toFixed(2)}x`} 
                  size="small"
                  color={node.roi >= 2.0 ? 'success' : 'warning'}
                />
                <Chip 
                  label={`${(utilizationRate * 100).toFixed(0)}% utilized`} 
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Allocated: R{node.allocated.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Spent: R{node.spent.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Remaining: R{(node.allocated - node.spent).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                bgcolor: node.roi >= 2.0 ? 'success.main' : 'warning.main',
                width: `${utilizationRate * 100}%`
              }}
            />
          </Box>
        </Paper>
        {hasChildren && node.children.map(child => renderHierarchyBudget(child, depth + 1))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Budget Console
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hierarchical budget allocation with AI-powered reallocation recommendations
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="2025-Q3">Q3 2025</MenuItem>
            <MenuItem value="2025-Q4">Q4 2025</MenuItem>
            <MenuItem value="2026-Q1">Q1 2026</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadBudgets}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/budgets/new')}
          >
            New Budget
          </Button>
        </Box>
      </Box>

      {selectedBudget && (() => {
        const totalBudget = selectedBudget.totalBudget || selectedBudget.totalAmount || selectedBudget.amount || 0;
        const allocated = selectedBudget.allocated || totalBudget;
        const spent = selectedBudget.spent || selectedBudget.spentAmount || selectedBudget.utilized || 0;
        const performance = selectedBudget.performance || { avgROI: 0, topPerformers: [], underPerformers: [] };
        const hierarchy = selectedBudget.hierarchy || [];
        const avgROI = performance.avgROI || 0;
        
        return (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Total Budget
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    R{totalBudget > 0 ? (totalBudget / 1000).toFixed(0) : '0'}K
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedBudget.period || selectedBudget.year || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Allocated
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    R{allocated > 0 ? (allocated / 1000).toFixed(0) : '0'}K
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalBudget > 0 ? ((allocated / totalBudget) * 100).toFixed(0) : 0}% of total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp color="info" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Spent
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    R{spent > 0 ? (spent / 1000).toFixed(0) : '0'}K
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {allocated > 0 ? ((spent / allocated) * 100).toFixed(0) : 0}% utilized
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ShowChart color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Avg ROI
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {avgROI.toFixed(2)}x
                  </Typography>
                  <Typography variant="caption" color={avgROI >= 2.0 ? 'success.main' : 'warning.main'}>
                    {avgROI >= 2.0 ? 'Above target' : 'Below target'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {reallocationSuggestions.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 1 }} color="primary" />
                AI Reallocation Recommendations
              </Typography>
              <Grid container spacing={2}>
                {reallocationSuggestions.map((suggestion, idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <DecisionCard
                      title={suggestion.name || `Reallocation ${idx + 1}`}
                      impact={{
                        label: 'Expected ROI Improvement',
                        value: suggestion.expectedROIImprovement || 0,
                        delta: suggestion.expectedDelta || 0,
                        unit: 'x'
                      }}
                      confidence={suggestion.confidence || 0.80}
                      hierarchyChips={suggestion.affectedHierarchy?.slice(0, 3) || []}
                      onSimulate={() => handleSimulateReallocation(suggestion)}
                      onApply={() => handleApplyReallocation(suggestion)}
                      explanation={suggestion.rationale || 'AI-generated reallocation based on historical ROI performance'}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hierarchical Budget Allocation
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {hierarchy.length > 0 ? (
                    hierarchy.map(node => renderHierarchyBudget(node))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hierarchy data available. Create budgets with hierarchy allocation to see details here.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ROI Curve
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {roiCurve && (
                    <Box>
                      <Box sx={{ height: 200, position: 'relative', mb: 2 }}>
                        <svg width="100%" height="100%" viewBox="0 0 300 200">
                          <polyline
                            points={(roiCurve?.points || []).map((p, i) => 
                              `${(p.budget / 600000) * 300},${200 - (p.roi / 3.5) * 200}`
                            ).join(' ')}
                            fill="none"
                            stroke="#7C3AED"
                            strokeWidth="2"
                          />
                          <line
                            x1={(roiCurve.optimal / 600000) * 300}
                            y1="0"
                            x2={(roiCurve.optimal / 600000) * 300}
                            y2="200"
                            stroke="#2e7d32"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        </svg>
                      </Box>
                      <Alert severity="success">
                        <Typography variant="caption">
                          Optimal budget: R{(roiCurve.optimal / 1000).toFixed(0)}K for maximum ROI
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Top Performers
                    </Typography>
                    {(performance.topPerformers || []).length > 0 ? (
                      performance.topPerformers.map((perf, idx) => (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">{perf.name}</Typography>
                            <Chip label={`${(perf.roi || 0).toFixed(2)}x`} size="small" color="success" />
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No data available</Typography>
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Under Performers
                    </Typography>
                    {(performance.underPerformers || []).length > 0 ? (
                      performance.underPerformers.map((perf, idx) => (
                        <Box key={idx} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">{perf.name}</Typography>
                            <Chip label={`${(perf.roi || 0).toFixed(2)}x`} size="small" color="warning" />
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No data available</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
        );
      })()}
    </Box>
  );
};

export default BudgetConsole;
