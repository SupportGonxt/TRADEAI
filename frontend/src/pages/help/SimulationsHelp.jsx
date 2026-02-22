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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Science as SimulationIcon,
  CompareArrows as CompareIcon,
  TrendingUp as OptimizeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SimulationsHelp = () => {
  const navigate = useNavigate();

  const simulationSteps = ['Define Scenario', 'Set Parameters', 'Run Simulation', 'Compare Results', 'Apply'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Simulations</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#7b1fa2', borderRadius: 2, p: 1.5, mr: 2 }}>
          <SimulationIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Simulations Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to run what-if scenarios and optimize promotions
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Simulations allow you to test different promotion scenarios before committing budget. 
              Run what-if analyses to predict ROI, compare alternatives, and optimize your trade 
              promotion strategy.
            </Typography>
            <Typography variant="body1">
              The Simulation Studio provides tools for scenario planning, constraint-based optimization, 
              and side-by-side comparison of results.
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Simulation Workflow</Typography>
            <Stepper activeStep={-1} alternativeLabel sx={{ mt: 2 }}>
              {simulationSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Simulation Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Promotion Simulation"
                    secondary="Test different promotion mechanics, discounts, and timing to predict ROI"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Budget Allocation Simulation"
                    secondary="Test different budget distributions across customers or products"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Scenario Comparison"
                    secondary="Compare multiple scenarios side-by-side to find the best option"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Optimization"
                    secondary="Let the system find the optimal parameters within your constraints"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Running a Simulation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Choose Simulation Type"
                    secondary="Select promotion, budget, or optimization simulation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Define Base Scenario"
                    secondary="Set the baseline parameters (products, customers, dates)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Create Variations"
                    secondary="Add alternative scenarios with different parameters"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Set Constraints"
                    secondary="Define budget limits, minimum ROI, or other constraints"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Run Simulation"
                    secondary="Execute the simulation to generate predicted results"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 6: Analyze Results"
                    secondary="Compare scenarios and identify the best option"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Scenario Comparison</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CompareIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1">Side-by-Side Analysis</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Compare up to 5 scenarios simultaneously:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">ROI Comparison</Typography>
                      <Typography variant="body2">
                        See predicted ROI for each scenario
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Spend Analysis</Typography>
                      <Typography variant="body2">
                        Compare total spend and efficiency
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Volume Impact</Typography>
                      <Typography variant="body2">
                        Predicted volume uplift per scenario
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Risk Assessment</Typography>
                      <Typography variant="body2">
                        Confidence levels and risk factors
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Optimization</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <OptimizeIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="subtitle1">AI-Powered Optimization</Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Let the system find optimal parameters:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Maximize ROI"
                    secondary="Find the discount level that maximizes return"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Maximize Volume"
                    secondary="Find parameters that drive highest volume within budget"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Budget Optimization"
                    secondary="Allocate budget across customers/products for best results"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Optimization uses historical data and machine learning to predict outcomes.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Applying Simulation Results</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Once you've found the best scenario, you can apply it:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Create Promotion"
                    secondary="Convert winning scenario directly into a new promotion"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Update Existing"
                    secondary="Apply optimized parameters to an existing draft promotion"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Save for Later"
                    secondary="Save simulation results for future reference"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Simulation History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                All simulations are saved for future reference:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="View Past Simulations"
                    secondary="Access all previously run simulations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Compare to Actuals"
                    secondary="See how predictions compared to actual results"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Clone and Modify"
                    secondary="Use past simulations as starting point for new ones"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#f3e5f5' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#7b1fa2', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Start with historical data"
                  secondary="Simulations are more accurate with good baseline data"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Test extreme scenarios"
                  secondary="Include best and worst case to understand range"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Set realistic constraints"
                  secondary="Budget and timing constraints improve relevance"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Review prediction accuracy"
                  secondary="Check how past predictions compared to actuals"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/scenarios')}>
                <ListItemText primary="Simulation Studio" />
              </ListItem>
              <ListItem button onClick={() => navigate('/scenarios')}>
                <ListItemText primary="Simulation History" />
              </ListItem>
              <ListItem button onClick={() => navigate('/scenarios')}>
                <ListItemText primary="Optimizer" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Data Requirements</Typography>
            <Typography variant="body2">
              Simulations require at least 6 months of historical sales data for accurate predictions.
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

export default SimulationsHelp;
