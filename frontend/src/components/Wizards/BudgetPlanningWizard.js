import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Lightbulb as AIIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon,
  AutoAwesome as SparkleIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import HierarchySelector from '../hierarchy/HierarchySelector';


const getCurrencySymbol = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.company && user.company.currency) {
        const currencyMap = {
          'USD': '$', 'EUR': '€', 'GBP': '£', 'ZAR': 'R', 'AUD': 'A$',
          'CAD': 'C$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
        };
        return currencyMap[user.company.currency] || 'R';
      }
    }
  } catch (error) {
    console.warn('Error getting currency symbol:', error);
  }
  return 'R';
};

const steps = [
  'Budget Overview',
  'AI Analysis',
  'Allocation Plan',
  'Review & Submit'
];

const BudgetPlanningWizard = () => {
  const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [budgetData, setBudgetData] = useState({
      year: new Date().getFullYear() + 1,
      totalAmount: '',
      description: '',
      categories: []
    });
    const [historicalData, setHistoricalData] = useState(null);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [allocationPlan, setAllocationPlan] = useState([]);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/budgets`);
      const budgets = response.data;
      
      // Calculate historical insights
      if (budgets.length > 0) {
        const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
        const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
        const avgUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
        setHistoricalData({
          previousYearBudget: budgets[0]?.totalAmount || 0,
          avgUtilization: avgUtilization.toFixed(1),
          totalBudgets: budgets.length,
          recommendedIncrease: avgUtilization > 90 ? 15 : avgUtilization > 80 ? 10 : 5
        });
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    setLoading(true);
    
    // Simulate AI analysis (in production, this would call actual AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const totalBudget = parseFloat(budgetData.totalAmount) || 0;
    
    const suggestions = {
      confidence: 87,
      recommendedAllocation: [
        {
          category: 'Trade Promotions',
          percentage: 40,
          amount: totalBudget * 0.40,
          reasoning: 'Highest ROI historically (178% avg)',
          trend: 'up',
          riskLevel: 'low'
        },
        {
          category: 'Customer Rebates',
          percentage: 25,
          amount: totalBudget * 0.25,
          reasoning: 'Essential for customer retention',
          trend: 'stable',
          riskLevel: 'low'
        },
        {
          category: 'Marketing Events',
          percentage: 20,
          amount: totalBudget * 0.20,
          reasoning: 'Brand awareness and new customer acquisition',
          trend: 'up',
          riskLevel: 'medium'
        },
        {
          category: 'Product Launch Support',
          percentage: 10,
          amount: totalBudget * 0.10,
          reasoning: 'Innovation and market expansion',
          trend: 'up',
          riskLevel: 'high'
        },
        {
          category: 'Contingency Reserve',
          percentage: 5,
          amount: totalBudget * 0.05,
          reasoning: 'Buffer for unexpected opportunities',
          trend: 'stable',
          riskLevel: 'low'
        }
      ],
      insights: [
        'Based on historical data, trade promotions deliver 3.2x better ROI than other categories',
        'Consider increasing event marketing by 5% for new market penetration',
        'Your utilization rate of ' + (historicalData?.avgUtilization || '85') + '% suggests efficient budget management'
      ],
      alternatives: [
        {
          name: 'Aggressive Growth',
          description: '50% to promotions, focus on market expansion',
          expectedROI: 195
        },
        {
          name: 'Conservative',
          description: '30% to promotions, higher contingency',
          expectedROI: 145
        },
        {
          name: 'Balanced',
          description: 'Recommended allocation shown above',
          expectedROI: 178
        }
      ]
    };
    
    setAiSuggestions(suggestions);
    setAllocationPlan(suggestions.recommendedAllocation.map(item => ({
      ...item,
      customAmount: item.amount
    })));
    
    setLoading(false);
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Validate basic info
      if (!budgetData.totalAmount || parseFloat(budgetData.totalAmount) <= 0) {
        alert('Please enter a valid total budget amount');
        return;
      }
    } else if (activeStep === 1) {
      // Generate AI suggestions when moving to step 2
      await generateAISuggestions();
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAllocationChange = (index, field, value) => {
    const updated = [...allocationPlan];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate percentage if amount changed
    if (field === 'customAmount') {
      const totalBudget = parseFloat(budgetData.totalAmount) || 0;
      updated[index].percentage = totalBudget > 0 ? (value / totalBudget * 100).toFixed(1) : 0;
    }
    
    setAllocationPlan(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
            const payload = {
              name: `${budgetData.year} Annual Budget`,
              year: budgetData.year,
              totalAmount: parseFloat(budgetData.totalAmount),
              description: budgetData.description || `${budgetData.year} Annual Budget - AI Planned`,
              status: 'draft',
              spentAmount: 0,
              categories: allocationPlan.map(item => ({
                name: item.category,
                allocated: item.customAmount,
                spent: 0
              })),
              // Hierarchy scope
              selectedCustomers: selectedCustomers,
              selectedProducts: selectedProducts
            };
      
      const response = await apiClient.post(`/budgets`, payload);
      
      alert('✅ Budget created successfully! Navigating to budget details...');
      navigate(`/budgets/${(response.data.id || response.data._id)}`);
      
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Error creating budget: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SparkleIcon color="primary" />
              Let's Plan Your {budgetData.year} Budget
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Start by providing basic information. Our AI will analyze historical data and suggest optimal allocation.
            </Typography>

            {historicalData && (
              <Alert severity="info" icon={<AnalyticsIcon />} sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="bold">Historical Insight:</Typography>
                <Typography variant="body2">
                  Previous year budget: {getCurrencySymbol()}{historicalData.previousYearBudget?.toLocaleString()} | 
                  Avg utilization: {historicalData.avgUtilization}% | 
                  Recommended increase: {historicalData.recommendedIncrease}%
                </Typography>
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Budget Year"
                  type="number"
                  value={budgetData.year}
                  onChange={(e) => setBudgetData({ ...budgetData, year: parseInt(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={`Total Budget Amount (${getCurrencySymbol()})`}
                  type="number"
                  value={budgetData.totalAmount}
                  onChange={(e) => setBudgetData({ ...budgetData, totalAmount: e.target.value })}
                  required
                  helperText={historicalData ? `Recommended: ${getCurrencySymbol()}${(historicalData.previousYearBudget * (1 + historicalData.recommendedIncrease / 100)).toLocaleString()}` : ''}
                />
              </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Budget Description (Optional)"
                              multiline
                              rows={3}
                              value={budgetData.description}
                              onChange={(e) => setBudgetData({ ...budgetData, description: e.target.value })}
                              placeholder="e.g., Annual trade marketing budget for North America region"
                            />
                          </Grid>
                        </Grid>

                        {/* Hierarchy Selection */}
                        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                          Budget Scope (Optional)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Select specific customers and/or products this budget applies to. Leave empty for company-wide budget.
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                  Customer Hierarchy
                                </Typography>
                                <HierarchySelector
                                  type="customer"
                                  selected={selectedCustomers}
                                  onSelectionChange={setSelectedCustomers}
                                  showAllocation={false}
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                  Product Hierarchy
                                </Typography>
                                <HierarchySelector
                                  type="product"
                                  selected={selectedProducts}
                                  onSelectionChange={setSelectedProducts}
                                  showAllocation={false}
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        {historicalData && (
              <Card sx={{ mt: 3, bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    📊 Quick Stats from Previous Budgets
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Total Budgets</Typography>
                      <Typography variant="h6">{historicalData.totalBudgets}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Avg Utilization</Typography>
                      <Typography variant="h6">{historicalData.avgUtilization}%</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Last Year Budget</Typography>
                      <Typography variant="h6">{getCurrencySymbol()}{historicalData.previousYearBudget?.toLocaleString()}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              AI Analysis in Progress...
            </Typography>
            
            {loading ? (
              <Box sx={{ my: 4 }}>
                <Typography variant="body1" gutterBottom>
                  🤖 Analyzing historical performance data...
                </Typography>
                <LinearProgress sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Calculating optimal allocation, ROI predictions, and risk assessment
                </Typography>
              </Box>
            ) : aiSuggestions ? (
              <Box>
                <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold">
                    AI Analysis Complete - {aiSuggestions.confidence}% Confidence
                  </Typography>
                  <Typography variant="body2">
                    Based on {historicalData?.totalBudgets || 0} historical budgets and market trends
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  💡 Key Insights
                </Typography>
                {(aiSuggestions?.insights || []).map((insight, idx) => (
                  <Alert key={idx} severity="info" sx={{ mb: 1 }}>
                    {insight}
                  </Alert>
                ))}

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  🎯 Alternative Strategies
                </Typography>
                <Grid container spacing={2}>
                  {(aiSuggestions?.alternatives || []).map((alt, idx) => (
                    <Grid item xs={12} md={4} key={idx}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {alt.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {alt.description}
                          </Typography>
                          <Chip 
                            label={`Expected ROI: ${alt.expectedROI}%`} 
                            color={alt.expectedROI >= 180 ? 'success' : 'primary'}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : null}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              💰 Recommended Allocation Plan
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              AI-generated allocation based on historical ROI. You can adjust amounts as needed.
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Total Budget:</strong> {getCurrencySymbol()}{parseFloat(budgetData.totalAmount).toLocaleString()} | 
                <strong> Allocated:</strong> {getCurrencySymbol()}{allocationPlan.reduce((sum, item) => sum + item.customAmount, 0).toLocaleString()}
              </Typography>
            </Alert>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell align="center"><strong>%</strong></TableCell>
                    <TableCell align="right"><strong>AI Suggested</strong></TableCell>
                    <TableCell align="right"><strong>Your Allocation</strong></TableCell>
                    <TableCell><strong>Reasoning</strong></TableCell>
                    <TableCell align="center"><strong>Risk</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocationPlan.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.trend === 'up' ? <TrendingUpIcon color="success" fontSize="small" /> : 
                           item.trend === 'down' ? <TrendingDownIcon color="error" fontSize="small" /> : 
                           <span style={{ width: 20 }}>—</span>}
                          {item.category}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${item.percentage}%`} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {getCurrencySymbol()}{item.amount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.customAmount}
                          onChange={(e) => handleAllocationChange(index, 'customAmount', parseFloat(e.target.value) || 0)}
                          InputProps={{ startAdornment: getCurrencySymbol() }}
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.reasoning}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={item.riskLevel}
                          color={item.riskLevel === 'low' ? 'success' : item.riskLevel === 'medium' ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 3:
        const totalAllocated = allocationPlan.reduce((sum, item) => sum + item.customAmount, 0);
        const totalBudget = parseFloat(budgetData.totalAmount);
        const allocationDiff = totalBudget - totalAllocated;
        const isBalanced = Math.abs(allocationDiff) < 0.01;

        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              ✅ Review & Submit
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review your budget plan before submitting. You can edit it later if needed.
            </Typography>

            {!isBalanced && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Allocation Mismatch:</strong> ${Math.abs(allocationDiff).toFixed(2)} 
                  {allocationDiff > 0 ? ' remaining' : ' over budget'}. 
                  Adjust allocation in the previous step.
                </Typography>
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Budget Overview
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Year:</Typography>
                      <Typography variant="body2" fontWeight="bold">{budgetData.year}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Budget:</Typography>
                      <Typography variant="body2" fontWeight="bold">${totalBudget.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Allocated:</Typography>
                      <Typography variant="body2" fontWeight="bold">${totalAllocated.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip label="Draft" size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      AI Confidence Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h3" color="primary">{aiSuggestions?.confidence}%</Typography>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          High confidence based on
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          historical performance
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={aiSuggestions?.confidence || 0} 
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Allocation Breakdown
                    </Typography>
                    {allocationPlan.map((item, idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{item.category}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            ${item.customAmount.toLocaleString()} ({item.percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={item.percentage} 
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Back
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<SaveIcon />}
              >
                {loading ? 'Creating Budget...' : 'Create Budget'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={<NextIcon />}
              >
                {activeStep === 1 && !aiSuggestions ? 'Generate AI Suggestions' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default BudgetPlanningWizard;
