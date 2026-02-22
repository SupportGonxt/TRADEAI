import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  AccountBalance as BudgetsIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BudgetsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Budgets</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#2e7d32', borderRadius: 2, p: 1.5, mr: 2 }}>
          <BudgetsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Budgets Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to plan, allocate, and track trade spend budgets
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Budgets in TRADEAI represent the financial allocation for trade promotion activities. 
              They can be structured annually, quarterly, or monthly, and can be allocated across 
              customers, products, channels, or regions using hierarchical allocation rules.
            </Typography>
            <Typography variant="body1">
              The system tracks budget utilization in real-time, providing visibility into planned 
              vs actual spend, remaining funds, and forecasted utilization.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Budget Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Annual Budget"
                    secondary="Full year trade spend allocation. Typically set during annual planning cycle."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Promotional Budget"
                    secondary="Allocated specifically for promotional activities like discounts and offers."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Listing Fees"
                    secondary="Budget for new product listings and shelf space payments."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Rebate Program"
                    secondary="Funds allocated for volume rebates and performance incentives."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Growth Initiative"
                    secondary="Special budget for strategic growth programs and market expansion."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Budget</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Define Budget Details"
                    secondary="Enter name, year, budget type, and total amount"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Set Allocation Rules"
                    secondary="Define how budget should be allocated (by customer, product, channel, region)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Configure Guardrails"
                    secondary="Set spending limits, approval thresholds, and warning levels"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Submit for Approval"
                    secondary="Budget goes through approval workflow before activation"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Hierarchical Allocation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                TRADEAI supports proportional budget allocation across hierarchies:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Volume-Based Allocation"
                    secondary="Allocate budget proportionally based on historical sales volume"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Revenue-Based Allocation"
                    secondary="Allocate budget proportionally based on revenue contribution"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Fixed Allocation"
                    secondary="Manually set specific amounts for each entity"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Hybrid Allocation"
                    secondary="Combine methods - e.g., 70% by volume, 30% fixed"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Allocation rules can be applied at any level of the customer or product hierarchy.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Tracking Utilization</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Monitor budget health with these key indicators:
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Utilization Example</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <LinearProgress variant="determinate" value={65} sx={{ height: 10, borderRadius: 5 }} />
                  </Box>
                  <Typography variant="body2">65% Utilized</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  R6.5M spent of R10M total budget
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="success.main">Healthy (0-70%)</Typography>
                      <Typography variant="body2">Budget on track with room for activities</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="warning.main">Warning (70-90%)</Typography>
                      <Typography variant="body2">Approaching limit, review commitments</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="error.main">Critical (90%+)</Typography>
                      <Typography variant="body2">Near exhaustion, restrict new activities</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="info.main">Committed</Typography>
                      <Typography variant="body2">Approved but not yet spent amounts</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Cloning Budgets</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Quickly create next year's budget by cloning:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Clone preserves structure"
                    secondary="All allocation rules and guardrails are copied"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Reset utilization"
                    secondary="Cloned budget starts with zero utilization"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Adjust amounts"
                    secondary="Modify total amount and allocations as needed"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#e8f5e9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#2e7d32', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Set realistic guardrails"
                  secondary="Warning at 70%, critical at 90% gives time to react"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Review monthly"
                  secondary="Regular reviews catch issues before they become problems"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Use forecasting"
                  secondary="Project year-end utilization based on current trends"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Document changes"
                  secondary="Keep audit trail of budget adjustments"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/budgets')}>
                <ListItemText primary="View All Budgets" />
              </ListItem>
              <ListItem button onClick={() => navigate('/budgets/new')}>
                <ListItemText primary="Create New Budget" />
              </ListItem>
              <ListItem button onClick={() => navigate('/budgets')}>
                <ListItemText primary="Budget Console" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="warning" icon={<WarningIcon />}>
            <Typography variant="subtitle2">Budget Locks</Typography>
            <Typography variant="body2">
              Budgets can be locked during period close to prevent changes. Contact Finance to unlock.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/help')}>
          Back to Help Center
        </Button>
      </Box>
    </Container>
  );
};

export default BudgetsHelp;
