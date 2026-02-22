import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Timeline,
  Assessment,
  Lightbulb,
  CheckCircle
} from '@mui/icons-material';

const OnboardingWizard = ({ open, onClose, userRole }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = userRole === 'jam' || userRole === 'key_account_manager'
    ? [
        'Welcome',
        'Your Dashboard',
        'AI Recommendations',
        'Create Promotions',
        'Alerts & Workflows',
        'Track Performance'
      ]
    : [
        'Welcome',
        'Your Dashboard',
        'Budget Management',
        'Simulation Studio',
        'Admin Tools',
        'Analytics & Reports'
      ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      localStorage.setItem('onboarding_completed', 'true');
      onClose();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  const renderStepContent = (step) => {
    if (userRole === 'jam' || userRole === 'key_account_manager') {
      switch (step) {
        case 0:
          return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Lightbulb sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Welcome to TRADEAI
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your AI-powered trade promotions management platform
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As a Key Account Manager, you'll have access to AI-driven recommendations,
                promotion planning tools, and real-time performance tracking.
              </Typography>
            </Box>
          );
        case 1:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your JAM Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your dashboard shows you the most important actions to take next.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUp color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Next-Best Promotions
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        AI-recommended promotions for your key accounts with expected ROI
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircle color="success" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Account Watchlist
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Accounts that need attention (churn risk, underperformance)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          );
        case 2:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                AI-Powered Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                TRADEAI uses AI to analyze customer behavior and suggest optimal promotions.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  What you'll see:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip label="Expected Net Revenue" size="small" />
                  <Chip label="ROI Prediction" size="small" />
                  <Chip label="Confidence Score" size="small" />
                  <Chip label="Hierarchy Breakdown" size="small" />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                You can simulate any recommendation before applying it to see the full impact.
              </Typography>
            </Box>
          );
        case 3:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Create Promotions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Use the Promotion Planner to create new promotions with AI guidance.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Features:
                </Typography>
                <ul style={{ marginTop: 8 }}>
                  <li>
                    <Typography variant="body2">
                      Hierarchy-based targeting (customer/product levels)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Real-time impact preview with proportional allocation
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Conflict detection and AI auto-fix suggestions
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Simulate before submitting for approval
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Box>
          );
        case 4:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Alerts & Workflows
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Stay informed and manage approval processes efficiently.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUp color="warning" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Notification Center
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        View alerts for budget thresholds, claim deadlines, and approval requests
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Timeline color="info" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Workflow Engine
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Track multi-step approval workflows with SLA monitoring
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          );
        case 5:
          return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                You're All Set!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You can always access help by pressing <strong>Ctrl+K</strong> (or Cmd+K on Mac)
                to open the command bar.
              </Typography>
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Quick Tips:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Use the command bar (Ctrl+K) for quick navigation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Check your dashboard daily for new recommendations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Set up alert rules for budget and claim thresholds
                </Typography>
              </Box>
            </Box>
          );
        default:
          return null;
      }
    } else {
      switch (step) {
        case 0:
          return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assessment sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Welcome to TRADEAI
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your AI-powered trade promotions management platform
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As a Manager, you'll have access to portfolio-level insights,
                budget optimization, and advanced analytics.
              </Typography>
            </Box>
          );
        case 1:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Manager Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your dashboard shows portfolio-level insights and optimization opportunities.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUp color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Budget Reallocation
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        AI-recommended budget moves with expected ROI improvement
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Timeline color="info" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Portfolio KPIs
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Track performance across all promotions and budgets
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          );
        case 2:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Budget Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The Budget Console gives you hierarchical budget allocation and optimization.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Features:
                </Typography>
                <ul style={{ marginTop: 8 }}>
                  <li>
                    <Typography variant="body2">
                      Hierarchical budget allocation with visual breakdown
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      AI reallocation recommendations with expected ROI improvement
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      ROI curve visualization showing optimal budget point
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      One-click reallocation application
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Box>
          );
        case 3:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Simulation Studio
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Compare multiple scenarios side-by-side before making decisions.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  What you can do:
                </Typography>
                <ul style={{ marginTop: 8 }}>
                  <li>
                    <Typography variant="body2">
                      Compare up to 4 scenarios simultaneously
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      View revenue waterfall charts (baseline → uplift → spend → net)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Set global constraints (total budget, min ROI, max concurrent)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Apply winning scenarios directly to promotion planner
                    </Typography>
                  </li>
                </ul>
              </Box>
            </Box>
          );
        case 4:
          return (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Admin Tools
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage roles, documents, integrations, and system configuration.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Assessment color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Role & Permission Management
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Define roles, assign permissions, and set approval limits per user
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Lightbulb color="warning" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600}>
                          Integrations & Documents
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Connect ERP/CRM systems, manage documents with version control
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          );
        case 5:
          return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                You're All Set!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You can always access help by pressing <strong>Ctrl+K</strong> (or Cmd+K on Mac)
                to open the command bar.
              </Typography>
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Quick Tips:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Use the command bar (Ctrl+K) for quick navigation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Review budget reallocation recommendations weekly
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Set up workflow templates for automated approvals
                </Typography>
              </Box>
            </Box>
          );
        default:
          return null;
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleSkip}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 500 }
      }}
    >
      <DialogTitle>
        <Stepper activeStep={activeStep} sx={{ pt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>
      <DialogContent>
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleSkip} color="inherit">
          Skip Tour
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
        >
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingWizard;
