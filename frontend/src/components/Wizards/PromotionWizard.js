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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Campaign as PromotionIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon,
  People as CustomerIcon,
  Inventory as ProductIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { formatLabel } from '../../utils/formatters';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';


const steps = [
  'Describe Promotion',
  'AI Recommendations',
  'Configure Details',
  'Review & Launch'
];

const PromotionWizard = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Hierarchy state
  const [customerHierarchies, setCustomerHierarchies] = useState([]);
  const [productHierarchies, setProductHierarchies] = useState([]);
  
  const [promotionData, setPromotionData] = useState({
    description: '',
    type: 'discount',
    customer: '',
    product: '',
    customerHierarchyLevel1: '',
    customerHierarchyLevel2: '',
    customerHierarchyLevel3: '',
    productHierarchyLevel1: '',
    productHierarchyLevel2: '',
    productHierarchyLevel3: '',
    startDate: null,
    endDate: null,
    discountPercentage: '',
    expectedROI: '',
    status: 'draft'
  });
  
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('balanced');

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchCustomerHierarchies();
    fetchProductHierarchies();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get(`/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get(`/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomerHierarchies = async () => {
    try {
      const response = await apiClient.get(`/customers/hierarchy`);
      // Transform hierarchy data to flat array with levels
      const hierarchyData = response.data || [];
      const flatHierarchies = [];
      const processHierarchy = (items, level = 1) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => {
          flatHierarchies.push({
            _id: item.id,
            name: item.name,
            level: level,
            value: item.value
          });
          if (item.children && Array.isArray(item.children)) {
            processHierarchy(item.children, level + 1);
          }
        });
      };
      processHierarchy(hierarchyData);
      setCustomerHierarchies(flatHierarchies);
    } catch (error) {
      console.error('Error fetching customer hierarchies:', error);
      setCustomerHierarchies([]);
    }
  };

  const fetchProductHierarchies = async () => {
    try {
      const response = await apiClient.get(`/products/hierarchy`);
      // Transform hierarchy data to flat array with levels
      const hierarchyData = response.data || [];
      const flatHierarchies = [];
      const processHierarchy = (items, level = 1) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => {
          flatHierarchies.push({
            _id: item.id,
            name: item.name,
            level: level,
            value: item.value
          });
          if (item.children && Array.isArray(item.children)) {
            processHierarchy(item.children, level + 1);
          }
        });
      };
      processHierarchy(hierarchyData);
      setProductHierarchies(flatHierarchies);
    } catch (error) {
      console.error('Error fetching product hierarchies:', error);
      setProductHierarchies([]);
    }
  };

  const generateAISuggestions = async () => {
    setLoading(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const suggestions = {
      confidence: 89,
      historicalContext: {
        similarPromotions: 12,
        avgROI: 178,
        successRate: 85,
        bestPerformingDiscount: 15
      },
      scenarios: [
        {
          id: 'aggressive',
          name: 'Aggressive Growth',
          description: 'High discount to maximize volume and market share',
          discount: 20,
          duration: 6,
          expectedVolumeLift: 65,
          expectedROI: 195,
          confidence: 82,
          pros: ['High volume increase', 'Strong market penetration', 'Customer acquisition'],
          cons: ['Lower margins', 'May set price expectations', 'Higher cost'],
          riskLevel: 'high'
        },
        {
          id: 'balanced',
          name: 'Balanced Approach (Recommended)',
          description: 'Optimal balance between volume growth and profitability',
          discount: 15,
          duration: 4,
          expectedVolumeLift: 42,
          expectedROI: 178,
          confidence: 89,
          pros: ['Proven success rate', 'Healthy margins', 'Sustainable growth'],
          cons: ['Moderate volume lift'],
          riskLevel: 'low'
        },
        {
          id: 'conservative',
          name: 'Conservative',
          description: 'Lower discount to protect margins',
          discount: 10,
          duration: 3,
          expectedVolumeLift: 28,
          expectedROI: 145,
          confidence: 91,
          pros: ['High margins', 'Low risk', 'Premium positioning'],
          cons: ['Lower volume impact', 'Less competitive'],
          riskLevel: 'low'
        }
      ],
      insights: [
        'Similar promotions in Q1 historically perform 23% better than other quarters',
        '15% discount has shown the best balance of volume lift (42%) and profitability (ROI 178%)',
        'Customers respond best to 4-week promotional periods for this product category',
        'Combining with BOGO offer could increase uplift by additional 15%'
      ],
      recommendations: {
        optimalDiscount: 15,
        optimalDuration: 4,
        bestStartDate: 'Beginning of month',
        expectedResults: {
          volumeLift: '42%',
          roi: '178%',
          revenueIncrease: '$125,000'
        }
      }
    };
    
    setAiSuggestions(suggestions);
    setLoading(false);
  };

  const applyScenario = (scenarioId) => {
    setSelectedScenario(scenarioId);
    const scenario = aiSuggestions.scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setPromotionData({
        ...promotionData,
        discountPercentage: scenario.discount,
        expectedROI: scenario.expectedROI,
        // Calculate end date based on duration (weeks)
        endDate: promotionData.startDate ? 
          new Date(promotionData.startDate.getTime() + (scenario.duration * 7 * 24 * 60 * 60 * 1000)) : 
          null
      });
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!promotionData.description) {
        alert('Please describe what promotion you want to create');
        return;
      }
      await generateAISuggestions();
    } else if (activeStep === 2) {
      // Validate required fields
      if (!promotionData.customer || !promotionData.product || !promotionData.startDate || !promotionData.endDate) {
        alert('Please fill in all required fields');
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const payload = {
        ...promotionData,
        aiGenerated: true,
        aiConfidence: aiSuggestions?.confidence,
        scenario: selectedScenario
      };
      
      const response = await apiClient.post(`/promotions`, payload);
      
      alert('✅ Promotion created successfully!');
      navigate(`/promotions/${(response.data.id || response.data._id)}`);
      
    } catch (error) {
      console.error('Error creating promotion:', error);
      alert('Error creating promotion: ' + (error.response?.data?.message || error.message));
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
              <AIIcon color="primary" />
              What promotion would you like to create?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Describe your promotion idea in natural language. Our AI will analyze it and suggest optimal parameters.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>💡 Example:</strong> "15% off promotion for Walmart on beverage products for Q1" 
                or "BOGO offer for new product launch"
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Promotion Description"
              multiline
              rows={4}
              value={promotionData.description}
              onChange={(e) => setPromotionData({ ...promotionData, description: e.target.value })}
              placeholder="Describe your promotion idea..."
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Promotion Type</InputLabel>
                  <Select
                    value={promotionData.type}
                    label="Promotion Type"
                    onChange={(e) => setPromotionData({ ...promotionData, type: e.target.value })}
                  >
                    <MenuItem value="discount">Percentage Discount</MenuItem>
                    <MenuItem value="bogo">Buy One Get One (BOGO)</MenuItem>
                    <MenuItem value="rebate">Customer Rebate</MenuItem>
                    <MenuItem value="bundle">Bundle Deal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Card sx={{ mt: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AIIcon /> What happens next?
                </Typography>
                <Typography variant="body2">
                  Our AI will analyze:
                  • Historical performance of similar promotions
                  • Optimal discount levels and duration
                  • Expected ROI and volume lift
                  • Risk assessment and alternatives
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              AI Analysis & Recommendations
            </Typography>

            {loading ? (
              <Box sx={{ my: 4 }}>
                <Typography variant="body1" gutterBottom>
                  🤖 Analyzing historical data and market trends...
                </Typography>
                <LinearProgress sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Generating optimal scenarios based on {aiSuggestions?.historicalContext.similarPromotions || 0} similar promotions
                </Typography>
              </Box>
            ) : aiSuggestions ? (
              <Box>
                <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold">
                    AI Analysis Complete - {aiSuggestions.confidence}% Confidence
                  </Typography>
                  <Typography variant="body2">
                    Based on {aiSuggestions.historicalContext.similarPromotions} similar promotions 
                    with {aiSuggestions.historicalContext.successRate}% success rate
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom>
                  💡 Key Insights
                </Typography>
                {(aiSuggestions?.insights || []).map((insight, idx) => (
                  <Alert key={idx} severity="info" sx={{ mb: 1 }} icon={<TrendingUpIcon />}>
                    {insight}
                  </Alert>
                ))}

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  🎯 Recommended Scenarios
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select a scenario that best fits your goals. You can fine-tune details in the next step.
                </Typography>

                <RadioGroup value={selectedScenario} onChange={(e) => applyScenario(e.target.value)}>
                  <Grid container spacing={2}>
                    {(aiSuggestions?.scenarios || []).map((scenario) => (
                      <Grid item xs={12} key={scenario.id}>
                        <Card 
                          sx={{ 
                            border: selectedScenario === scenario.id ? 2 : 1, 
                            borderColor: selectedScenario === scenario.id ? 'primary.main' : 'divider',
                            cursor: 'pointer'
                          }}
                          onClick={() => applyScenario(scenario.id)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <FormControlLabel 
                                value={scenario.id} 
                                control={<Radio />}
                                label=""
                                sx={{ m: 0 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="h6">
                                    {scenario.name}
                                  </Typography>
                                  {scenario.id === 'balanced' && (
                                    <Chip label="Recommended" color="primary" size="small" />
                                  )}
                                  <Chip 
                                    label={`${scenario.confidence}% confidence`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                  {scenario.description}
                                </Typography>
                                
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Discount</Typography>
                                    <Typography variant="h6">{scenario.discount}%</Typography>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Duration</Typography>
                                    <Typography variant="h6">{scenario.duration} weeks</Typography>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Volume Lift</Typography>
                                    <Typography variant="h6" color="success.main">+{scenario.expectedVolumeLift}%</Typography>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Expected ROI</Typography>
                                    <Typography variant="h6" color="success.main">{scenario.expectedROI}%</Typography>
                                  </Grid>
                                </Grid>

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">
                                      ✓ Pros:
                                    </Typography>
                                    {scenario.pros.map((pro, idx) => (
                                      <Typography key={idx} variant="body2" color="text.secondary">
                                        • {pro}
                                      </Typography>
                                    ))}
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="warning.main" fontWeight="bold">
                                      ⚠ Cons:
                                    </Typography>
                                    {scenario.cons.map((con, idx) => (
                                      <Typography key={idx} variant="body2" color="text.secondary">
                                        • {con}
                                      </Typography>
                                    ))}
                                  </Box>
                                </Box>

                                <Box sx={{ mt: 2 }}>
                                  <Chip 
                                    label={`Risk: ${formatLabel(scenario.riskLevel)}`}
                                    color={scenario.riskLevel === 'low' ? 'success' : scenario.riskLevel === 'medium' ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </Box>
            ) : null}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Configure Promotion Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Fine-tune the details. Pre-filled values are based on AI recommendations.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Selected Scenario:</strong> {aiSuggestions?.scenarios.find(s => s.id === selectedScenario)?.name} | 
                <strong> Expected ROI:</strong> {promotionData.expectedROI}% | 
                <strong> Confidence:</strong> {aiSuggestions?.confidence}%
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={promotionData.customer}
                    label="Customer"
                    onChange={(e) => setPromotionData({ ...promotionData, customer: e.target.value })}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.id || customer._id} value={customer.id || customer._id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={promotionData.product}
                    label="Product"
                    onChange={(e) => setPromotionData({ ...promotionData, product: e.target.value })}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id || product._id} value={product.id || product._id}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Customer Hierarchy Selectors */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Customer Hierarchy Level 1</InputLabel>
                  <Select
                    value={promotionData.customerHierarchyLevel1}
                    label="Customer Hierarchy Level 1"
                    onChange={(e) => setPromotionData({ ...promotionData, customerHierarchyLevel1: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {customerHierarchies.filter(h => h.level === 1).map((hierarchy) => (
                      <MenuItem key={hierarchy.id || hierarchy._id} value={hierarchy.id || hierarchy._id}>
                        {hierarchy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Customer Hierarchy Level 2</InputLabel>
                  <Select
                    value={promotionData.customerHierarchyLevel2}
                    label="Customer Hierarchy Level 2"
                    onChange={(e) => setPromotionData({ ...promotionData, customerHierarchyLevel2: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {customerHierarchies.filter(h => h.level === 2).map((hierarchy) => (
                      <MenuItem key={hierarchy.id || hierarchy._id} value={hierarchy.id || hierarchy._id}>
                        {hierarchy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Customer Hierarchy Level 3</InputLabel>
                  <Select
                    value={promotionData.customerHierarchyLevel3}
                    label="Customer Hierarchy Level 3"
                    onChange={(e) => setPromotionData({ ...promotionData, customerHierarchyLevel3: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {customerHierarchies.filter(h => h.level === 3).map((hierarchy) => (
                      <MenuItem key={hierarchy.id || hierarchy._id} value={hierarchy.id || hierarchy._id}>
                        {hierarchy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Product Hierarchy Selectors */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Product Hierarchy Level 1</InputLabel>
                  <Select
                    value={promotionData.productHierarchyLevel1}
                    label="Product Hierarchy Level 1"
                    onChange={(e) => setPromotionData({ ...promotionData, productHierarchyLevel1: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {productHierarchies.filter(h => h.level === 1).map((hierarchy) => (
                      <MenuItem key={hierarchy.id || hierarchy._id} value={hierarchy.id || hierarchy._id}>
                        {hierarchy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Product Hierarchy Level 2</InputLabel>
                  <Select
                    value={promotionData.productHierarchyLevel2}
                    label="Product Hierarchy Level 2"
                    onChange={(e) => setPromotionData({ ...promotionData, productHierarchyLevel2: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {productHierarchies.filter(h => h.level === 2).map((hierarchy) => (
                      <MenuItem key={hierarchy.id || hierarchy._id} value={hierarchy.id || hierarchy._id}>
                        {hierarchy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Product Hierarchy Level 3</InputLabel>
                  <Select
                    value={promotionData.productHierarchyLevel3}
                    label="Product Hierarchy Level 3"
                    onChange={(e) => setPromotionData({ ...promotionData, productHierarchyLevel3: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {productHierarchies.filter(h => h.level === 3).map((hierarchy) => (
                      <MenuItem key={hierarchy.id || hierarchy._id} value={hierarchy.id || hierarchy._id}>
                        {hierarchy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={promotionData.startDate}
                    onChange={(date) => setPromotionData({ ...promotionData, startDate: date })}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={promotionData.endDate}
                    onChange={(date) => setPromotionData({ ...promotionData, endDate: date })}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={promotionData.startDate}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Discount Percentage"
                  type="number"
                  value={promotionData.discountPercentage}
                  onChange={(e) => setPromotionData({ ...promotionData, discountPercentage: e.target.value })}
                  InputProps={{ endAdornment: '%' }}
                  helperText={`AI recommended: ${aiSuggestions?.recommendations.optimalDiscount}%`}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expected ROI"
                  type="number"
                  value={promotionData.expectedROI}
                  onChange={(e) => setPromotionData({ ...promotionData, expectedROI: e.target.value })}
                  InputProps={{ endAdornment: '%' }}
                  disabled
                  helperText="Auto-calculated based on AI analysis"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes (Optional)"
                  multiline
                  rows={3}
                  placeholder="Any additional information or special requirements..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const selectedCustomer = customers.find(c => (c.id || c._id) === promotionData.customer);
        const selectedProduct = products.find(p => (p.id || p._id) === promotionData.product);
        const selectedScenarioData = aiSuggestions?.scenarios.find(s => s.id === selectedScenario);
        const duration = promotionData.startDate && promotionData.endDate ? 
          Math.ceil((promotionData.endDate - promotionData.startDate) / (1000 * 60 * 60 * 24 * 7)) : 0;

        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon color="success" />
              Review & Launch Promotion
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review all details before launching. The promotion will be created as a draft.
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>🎯 Predicted Performance:</strong> {selectedScenarioData?.expectedVolumeLift}% volume lift, 
                {promotionData.expectedROI}% ROI with {aiSuggestions?.confidence}% confidence
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Promotion Overview
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PromotionIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Type" 
                          secondary={formatLabel(promotionData.type)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <MoneyIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Discount" 
                          secondary={`${promotionData.discountPercentage}%`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <CalendarIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Duration" 
                          secondary={`${duration} weeks`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Target Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            <CustomerIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Customer" 
                          secondary={selectedCustomer?.name || 'Not selected'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <ProductIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Product" 
                          secondary={selectedProduct?.name || 'Not selected'}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AIIcon color="primary" />
                      AI Prediction Summary
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" color="success.main">
                            {selectedScenarioData?.expectedVolumeLift}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Volume Lift
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" color="primary.main">
                            {promotionData.expectedROI}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expected ROI
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" color="info.main">
                            {aiSuggestions?.confidence}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                          <Typography variant="h4" color="warning.main">
                            {formatLabel(selectedScenarioData?.riskLevel)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Risk Level
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary">
                      <strong>AI Scenario:</strong> {selectedScenarioData?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {selectedScenarioData?.description}
                    </Typography>
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
                color="success"
              >
                {loading ? 'Creating Promotion...' : 'Launch Promotion'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={<NextIcon />}
              >
                {activeStep === 0 && !aiSuggestions ? 'Analyze with AI' : 'Next'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PromotionWizard;
