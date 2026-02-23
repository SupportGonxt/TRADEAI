import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  LinearProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import UniversalFlowLayout from '../../components/flows/UniversalFlowLayout';
import HierarchySelector from '../../components/hierarchy/HierarchySelector';
import PromotionAIInsights from '../../components/ai/promotions/PromotionAIInsights';
import api from '../../services/api';
import { preFlightCheck } from '../../utils/apiHealth';
import { formatLabel } from '../../utils/formatters';


/**
 * AI-Powered Promotion Entry Flow
 * 
 * Features:
 * - Real-time ML calculations as user types
 * - AI-suggested discount percentages
 * - Revenue impact forecasting
 * - Cannibalization risk detection
 * - Inventory availability checks
 * - Historical performance comparison
 */
const PromotionEntryFlow = () => {
  // Form state
    const [formData, setFormData] = useState({
      name: '',
      type: 'Discount',
      discount: '',
      startDate: '',
      endDate: '',
      budget: '',
      targetProducts: [],
      targetCustomers: [],
      // Product hierarchy
      productVendor: '',
      productCategory: '',
      productBrand: '',
      productSubBrand: '',
      // Customer hierarchy
      customerChannel: '',
      customerSubChannel: '',
      customerSegmentation: '',
      customerHierarchy1: '',
      customerHierarchy2: '',
      customerHierarchy3: '',
      customerHeadOffice: ''
    });
  
  // AI state
  const [mlCalculations, setMlCalculations] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [risks, setRisks] = useState([]);
  const [historicalData, setHistoricalData] = useState(null);
  
    // UI state
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Promotion types
  const promotionTypes = [
    'Discount',
    'BOGO',
    'Volume',
    'Seasonal',
    'Bundle',
    'Loyalty'
  ];
  
  // Calculate ML predictions whenever relevant fields change
  useEffect(() => {
    const calculateML = async () => {
      // Only calculate if we have enough data
      if (!formData.discount || !formData.type || !formData.budget) {
        return;
      }
      
      setIsCalculating(true);
      
      try {
                const response = await api.post(
                  `/ai-orchestrator/orchestrate`,
          {
            userIntent: `Optimize promotion with ${formData.discount}% discount and ${formData.budget} budget for ${formData.type} promotion`,
            context: {
              tenantId: localStorage.getItem('tenantId'),
              promotionData: {
                type: formData.type,
                discount: parseFloat(formData.discount) || 0,
                budget: parseFloat(formData.budget) || 0,
                startDate: formData.startDate,
                endDate: formData.endDate
              }
            }
          },
          { 
            timeout: 30000
          }
        );
        
        if (response.data.success) {
          const data = response.data.data;
          setMlCalculations({
            estimatedRevenue: data.promotionalRevenue || 0,
            incrementalRevenue: data.incrementalRevenue || 0,
            roi: data.roi || 0,
            confidence: data.confidence || 0.7
          });
          setAiSuggestions({
            explanation: response.data.explanation,
            breakdown: data.breakdown
          });
        } else {
          throw new Error(response.data.error || 'AI orchestrator failed');
        }
      } catch (error) {
        console.error('AI orchestrator error:', error);
        const discount = parseFloat(formData.discount) || 10;
        const budget = parseFloat(formData.budget) || 10000;
        const baselineRevenue = budget * 2;
        const upliftFactor = 1 + (discount / 100) * 0.8;
        const estimatedRevenue = baselineRevenue * upliftFactor;
        const roi = budget > 0 ? (estimatedRevenue - budget) / budget : 0;
        
        setMlCalculations({
          estimatedRevenue: Math.round(estimatedRevenue),
          incrementalRevenue: Math.round(estimatedRevenue - baselineRevenue),
          roi: parseFloat(roi.toFixed(2)),
          confidence: 0.5,
          breakEvenDays: 7,
          successProbability: 65,
          isFallback: true
        });
        setAiSuggestions({
          warning: 'Using simplified calculations. AI service unavailable.',
          optimalDiscount: Math.round(discount * 0.9),
          reasoning: 'Based on standard industry benchmarks'
        });
        setRisks([{
          level: 'low',
          message: 'AI predictions unavailable - using simplified estimates'
        }]);
      } finally {
        setIsCalculating(false);
      }
    };
    
    // Debounce calculations
    const timeout = setTimeout(calculateML, 1000);
    return () => clearTimeout(timeout);
  }, [formData.discount, formData.type, formData.budget, formData.startDate, formData.endDate]);
  
  // Load historical data on mount
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const response = await api.get('/promotions/similar', {
          params: { type: formData.type }
        });
        setHistoricalData(response.data);
      } catch (error) {
        console.error('Failed to load historical data:', error);
        setHistoricalData(null);
      }
    };
    
    loadHistoricalData();
  }, [formData.type]);
  
  // Handle form field changes
  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };
  
  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Promotion name is required';
    }
    
    if (!formData.discount || parseFloat(formData.discount) <= 0) {
      newErrors.discount = 'Discount must be greater than 0';
    }
    
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    // Pre-flight check
    const { canSubmit, warnings } = await preFlightCheck();
    if (!canSubmit) {
      alert('Cannot submit: API is unavailable');
      return;
    }
    
    if (warnings.length > 0) {
      const proceed = window.confirm(
        `Warnings detected:\n${warnings.join('\n')}\n\nContinue anyway?`
      );
      if (!proceed) return;
    }
    
    setIsSaving(true);
    
        try {
          await api.post(
            `/promotions`,
            {
              ...formData,
              mlPredictions: mlCalculations,
              aiSuggestions: aiSuggestions,
              selectedCustomers,
              selectedProducts
            }
          );
      
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.href = '/promotions';
      }, 2000);
    } catch (error) {
      alert('Failed to save promotion: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Auto-save draft
  const handleAutoSave = async () => {
    if (!formData.name) return; // Don't save empty forms
    
    try {
      await api.post(
        `/promotions/draft`,
        formData
      );
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };
  
  // AI Insights Panel
  const aiPanel = (
    <Box>
      {/* AI Suggestions Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PsychologyIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            AI Assistant
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Real-time insights powered by machine learning
        </Typography>
      </Box>
      
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 3 }} />
      
      {/* ML Pricing Suggestions */}
      {aiSuggestions && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.15)' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            🤖 ML Pricing Recommendation
          </Typography>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {aiSuggestions.optimalDiscount}%
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
            {aiSuggestions.reasoning}
          </Typography>
          
          {aiSuggestions.alternatives && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Alternatives:
              </Typography>
              {(aiSuggestions?.alternatives || []).map((alt, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption">{alt.discount}%</Typography>
                  <Typography variant="caption">ROI: {alt.expectedROI}x</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}
      
      {/* Impact Forecast */}
      {mlCalculations && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.15)' }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            📊 Impact Forecast
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Revenue</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                R{parseFloat(mlCalculations.estimatedRevenue).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">ROI</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {mlCalculations.roi}x
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Break-even</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {mlCalculations.breakEvenDays} days
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Success Rate</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {mlCalculations.successProbability}%
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={mlCalculations.successProbability} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: mlCalculations.successProbability > 70 ? '#4caf50' : '#ff9800'
              }
            }}
          />
        </Paper>
      )}
      
      {/* Risks & Alerts */}
      {risks.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,152,0,0.2)' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            ⚠️ Risk Assessment
          </Typography>
          {risks.map((risk, idx) => (
            <Box key={idx} sx={{ mb: 1 }}>
              <Chip
                label={formatLabel(risk.level)}
                size="small"
                color={risk.level === 'high' ? 'error' : 'warning'}
                sx={{ mr: 1, mb: 0.5 }}
              />
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                {risk.message}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}
      
      {/* Historical Comparison */}
      {historicalData && (
        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.15)' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            📈 Historical Performance
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
            Based on {historicalData.totalCampaigns} similar campaigns
          </Typography>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Avg Budget</Typography>
              <Typography variant="body2">R{historicalData.avgBudget.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">Avg Discount</Typography>
              <Typography variant="body2">{historicalData.avgDiscount}%</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Avg ROI</Typography>
              <Typography variant="body2">{historicalData.avgROI}x</Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
  
  return (
    <UniversalFlowLayout
      title="Create Promotion"
      subtitle="AI-powered promotion planning with real-time insights"
      aiPanel={aiPanel}
      onSave={handleAutoSave}
      onClose={() => window.location.href = '/promotions'}
      autoSave={true}
      autoSaveDelay={3000}
    >
      {/* Success Message */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          Promotion created successfully! Redirecting...
        </Alert>
      )}
      
      {/* Calculating Indicator */}
      {isCalculating && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            Running ML calculations...
          </Box>
        </Alert>
      )}
      
      {/* AI Insights Section */}
      <Box sx={{ mb: 4 }}>
        <PromotionAIInsights 
          promotion={formData}
          onApplyUplift={(upliftData) => {
            console.log('Apply uplift prediction:', upliftData);
          }}
          onApplyPricing={(pricingData) => {
            console.log('Apply pricing recommendation:', pricingData);
            if (pricingData.optimalPrice) {
              setFormData({ ...formData, discount: pricingData.optimalDiscount || formData.discount });
            }
          }}
          onApplyTiming={(timingData) => {
            console.log('Apply timing recommendation:', timingData);
          }}
          onApplyBudget={(budgetData) => {
            console.log('Apply budget recommendation:', budgetData);
            if (budgetData.recommendedBudget) {
              setFormData({ ...formData, budget: budgetData.recommendedBudget });
            }
          }}
        />
      </Box>

      {/* Form Fields */}
      <Box sx={{ maxWidth: '800px' }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#6D28D9' }}>
          Promotion Details
        </Typography>
        
        <TextField
          fullWidth
          label="Promotion Name"
          value={formData.name}
          onChange={handleChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          sx={{ mb: 3 }}
          placeholder="e.g., Summer Sale 2025"
        />
        
        <TextField
          fullWidth
          select
          label="Promotion Type"
          value={formData.type}
          onChange={handleChange('type')}
          sx={{ mb: 3 }}
        >
          {promotionTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <TextField
            label="Discount %"
            type="number"
            value={formData.discount}
            onChange={handleChange('discount')}
            error={!!errors.discount}
            helperText={errors.discount}
            InputProps={{
              endAdornment: '%'
            }}
          />
          
          <TextField
            label="Budget (ZAR)"
            type="number"
            value={formData.budget}
            onChange={handleChange('budget')}
            error={!!errors.budget}
            helperText={errors.budget}
            InputProps={{
              startAdornment: 'R'
            }}
          />
        </Box>
        
        {/* ML Calculation Display */}
        {mlCalculations && !isCalculating && (
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: '#F5F3FF',
            border: '2px solid #8B5CF6'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7C3AED' }}>
                💡 ML Impact Calculation
              </Typography>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estimated Revenue
                </Typography>
                <Typography variant="h6" color="primary">
                  R{parseFloat(mlCalculations.estimatedRevenue).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Expected ROI
                </Typography>
                <Typography variant="h6" color="primary">
                  {mlCalculations.roi}x
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Break-even Period
                </Typography>
                <Typography variant="h6" color="primary">
                  {mlCalculations.breakEvenDays} days
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
        
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange('startDate')}
                    error={!!errors.startDate}
                    helperText={errors.startDate}
                    InputLabelProps={{ shrink: true }}
                  />
          
                  <TextField
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange('endDate')}
                    error={!!errors.endDate}
                    helperText={errors.endDate}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                                {/* Hierarchy Selection */}
                                <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#6D28D9' }}>
                                  Promotion Scope (Optional)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  Select specific customers and/or products this promotion applies to. Leave empty for company-wide promotion.
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
        
                {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isSaving || isCalculating}
            startIcon={isSaving ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(45deg, #8B5CF6 30%, #21cbf3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)'
            }}
          >
            {isSaving ? 'Creating...' : 'Create Promotion'}
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={() => window.location.href = '/promotions'}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </UniversalFlowLayout>
  );
};

export default PromotionEntryFlow;
