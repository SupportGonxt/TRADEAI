import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  LightbulbOutlined as LightbulbIcon
} from '@mui/icons-material';
import { formatLabel } from '../../../../utils/formatters';

const AIAnalysisStep= ({ data, onChange, errors = {} }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    // Simulate AI analysis with timeout
    const performAnalysis = () => {
      setIsAnalyzing(true);
      
      setTimeout(() => {
        // Generate AI insights based on customer data
        const insights = generateAIInsights(data);
        setAiInsights(insights);
        setIsAnalyzing(false);
        
        // Store AI insights in form data
        onChange({ ...data, aiInsights: insights });
      }, 2000); // Simulate 2-second analysis
    };

    performAnalysis();
  }, [data.name, data.customerType, data.creditLimit, data.tier]);

  const generateAIInsights = (customerData) => {
    // Client-side AI simulation (in production, this would call backend AI service)
    const creditLimit = parseFloat(customerData.creditLimit) || 50000;
    const tier = customerData.tier || 'standard';
    const customerType = customerData.customerType || 'retailer';
    
    // Calculate risk score (0-100, lower is better)
    let riskScore = 50;
    if (tier === 'platinum') riskScore -= 20;
    else if (tier === 'gold') riskScore -= 10;
    else if (tier === 'bronze') riskScore += 10;
    
    if (customerType === 'chain') riskScore -= 5;
    else if (customerType === 'independent') riskScore += 10;
    
    if (creditLimit > 100000) riskScore -= 10;
    else if (creditLimit < 20000) riskScore += 15;
    
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Calculate credit score (300-850)
    const creditScore = Math.round(850 - (riskScore * 5.5));
    
    // Calculate predicted LTV
    const avgSpendMultiplier = customerType === 'chain' ? 3 : customerType === 'distributor' ? 2.5 : 1.5;
    const predictedLTV = Math.round(creditLimit * avgSpendMultiplier * 3); // 3-year projection
    
    // Determine risk level
    let riskLevel = 'low';
    let riskColor = 'success';
    if (riskScore > 60) {
      riskLevel = 'high';
      riskColor = 'error';
    } else if (riskScore > 40) {
      riskLevel = 'medium';
      riskColor = 'warning';
    }
    
    // Determine segment
    let segment = 'Standard';
    if (tier === 'platinum' || tier === 'gold') {
      segment = 'Premium';
    } else if (creditLimit > 100000) {
      segment = 'High-Value';
    } else if (customerType === 'independent' && creditLimit < 30000) {
      segment = 'Small Business';
    }
    
    // Generate recommendations
    const recommendations = [];
    if (riskScore < 30) {
      recommendations.push({
        icon: <CheckCircleIcon />,
        type: 'positive',
        text: 'Low risk profile - consider extending credit terms or increasing limit'
      });
    }
    if (creditLimit > 100000) {
      recommendations.push({
        icon: <InfoIcon />,
        type: 'info',
        text: 'High-value customer - assign dedicated account manager'
      });
    }
    if (customerType === 'chain') {
      recommendations.push({
        icon: <TrendingUpIcon />,
        type: 'opportunity',
        text: 'Chain customer - explore volume rebate opportunities'
      });
    }
    if (riskScore > 50) {
      recommendations.push({
        icon: <WarningIcon />,
        type: 'warning',
        text: 'Elevated risk - recommend shorter payment terms (NET30)'
      });
    }
    if (tier === 'standard' && creditLimit > 75000) {
      recommendations.push({
        icon: <LightbulbIcon />,
        type: 'suggestion',
        text: 'Customer qualifies for tier upgrade - consider Silver or Gold tier'
      });
    }
    
    // Growth opportunities
    const opportunities = [];
    if (customerType === 'retailer' || customerType === 'independent') {
      opportunities.push('Cross-sell complementary product categories');
    }
    if (predictedLTV > 200000) {
      opportunities.push('Upsell premium products and services');
    }
    opportunities.push('Introduce loyalty program for repeat purchases');
    if (segment === 'Premium') {
      opportunities.push('Offer exclusive early access to new products');
    }
    
    return {
      riskScore,
      riskLevel,
      riskColor,
      creditScore,
      predictedLTV,
      segment,
      recommendations,
      opportunities,
      churnProbability: Math.round(riskScore / 3), // Simplified churn prediction
      recommendedCreditLimit: Math.round(creditLimit * (1 + (100 - riskScore) / 200))
    };
  };

  if (isAnalyzing) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AIIcon color="primary" />
          AI-Powered Customer Analysis
        </Typography>
        
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'primary.50' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Analyzing Customer Profile...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            AI is evaluating risk factors, credit worthiness, and growth opportunities
          </Typography>
          <LinearProgress sx={{ mt: 3 }} />
        </Paper>
      </Box>
    );
  }

  if (!aiInsights) {
    return (
      <Alert severity="error">
        Unable to generate AI insights. Please ensure all required fields are filled.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI-Powered Customer Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Our AI has analyzed the customer profile and generated insights, risk assessment, and recommendations.
      </Typography>

      <Grid container spacing={3}>
        {/* Risk Assessment */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon fontSize="small" />
              Risk Assessment
            </Typography>
            
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Risk Score</Typography>
                <Typography variant="body2" fontWeight="bold">{aiInsights.riskScore}/100</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={aiInsights.riskScore} 
                color={aiInsights.riskColor}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Chip 
                  label={`${formatLabel(aiInsights.riskLevel)} RISK`}
                  color={aiInsights.riskColor}
                  size="large"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Churn Probability
              </Typography>
              <Typography variant="h6">
                {aiInsights.churnProbability}%
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Credit Analysis */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon fontSize="small" />
              Credit Analysis
            </Typography>
            
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">Credit Score</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {aiInsights.creditScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Range: 300-850 (Excellent: 750+)
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Recommended Credit Limit
              </Typography>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MoneyIcon fontSize="small" />
                ${aiInsights.recommendedCreditLimit.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Customer Segment & LTV */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%', bgcolor: 'info.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Customer Segment
            </Typography>
            <Chip 
              label={aiInsights.segment}
              color="info"
              size="large"
              sx={{ fontSize: '1.1rem', fontWeight: 'bold', my: 1 }}
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Predicted Lifetime Value (3 years)
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              ${aiInsights.predictedLTV.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* AI Recommendations */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightbulbIcon fontSize="small" />
              AI Recommendations
            </Typography>
            
            <List dense>
              {(aiInsights?.recommendations || []).map((rec, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {React.cloneElement(rec.icon, { 
                      fontSize: 'small',
                      color: rec.type === 'warning' ? 'warning' : rec.type === 'positive' ? 'success' : 'info'
                    })}
                  </ListItemIcon>
                  <ListItemText 
                    primary={rec.text}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Growth Opportunities */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, bgcolor: 'success.50' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon fontSize="small" />
              Growth Opportunities
            </Typography>
            
            <Grid container spacing={1}>
              {(aiInsights?.opportunities || []).map((opp, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Chip 
                    icon={<TrendingUpIcon />}
                    label={opp}
                    variant="outlined"
                    color="success"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Summary Note */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<AIIcon />}>
            <Typography variant="body2">
              <strong>AI Analysis Complete:</strong> These insights are generated using machine learning algorithms
              based on customer profile, industry benchmarks, and historical patterns. Use these recommendations
              to optimize customer relationship management and maximize value.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAnalysisStep;
