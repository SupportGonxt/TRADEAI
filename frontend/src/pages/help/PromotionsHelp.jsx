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
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Campaign as PromotionsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PromotionsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/help')}
        >
          Help Center
        </Link>
        <Typography color="text.primary">Promotions</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#7C3AED', borderRadius: 2, p: 1.5, mr: 2 }}>
          <PromotionsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Promotions Help
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to create, manage, and track trade promotions
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Overview
            </Typography>
            <Typography variant="body1" paragraph>
              Promotions are the core of trade promotion management. They represent agreements with retailers 
              to run specific promotional activities in exchange for trade spend funding. TRADEAI supports 
              various promotion types including price discounts, volume rebates, BOGO offers, and more.
            </Typography>
            <Typography variant="body1">
              Each promotion goes through a lifecycle: Draft, Pending Approval, Approved, Active, and Completed. 
              The system tracks performance metrics like ROI, uplift, and spend efficiency throughout.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating a Promotion</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 1: Basic Information"
                    secondary="Enter promotion name, description, and select the promotion type (Price Discount, Volume Rebate, BOGO, Bundle, Gift, Loyalty)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 2: Set Dates"
                    secondary="Define sell-in dates (when retailers can order) and sell-out dates (when promotion runs in stores)"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 3: Select Products"
                    secondary="Choose which products are included in the promotion. You can select individual SKUs or entire categories"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 4: Select Customers"
                    secondary="Choose which customers/retailers will participate. You can select by tier, channel, or individually"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 5: Define Mechanics"
                    secondary="Set the discount percentage, volume thresholds, or other promotion-specific parameters"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 6: Assign Budget"
                    secondary="Link the promotion to a budget and specify the planned spend amount"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Step 7: Submit for Approval"
                    secondary="Review all details and submit the promotion for approval"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Promotion Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Price Discount"
                    secondary="A percentage or fixed amount off the regular price. Most common type for driving volume."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Volume Rebate"
                    secondary="Rebate paid when customer reaches volume thresholds. Encourages larger orders."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="BOGO (Buy One Get One)"
                    secondary="Customer receives free product with purchase. Great for trial and volume."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Bundle"
                    secondary="Multiple products sold together at a special price. Drives cross-category sales."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Gift with Purchase"
                    secondary="Free gift item included with qualifying purchase. Adds perceived value."
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText 
                    primary="Loyalty"
                    secondary="Points or rewards for repeat purchases. Builds long-term customer relationships."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Approval Workflow</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Promotions follow a configurable approval workflow based on your organization's rules:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Auto-Approval"
                    secondary="Promotions under certain thresholds may be auto-approved based on rules"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Single Approval"
                    secondary="One approver reviews and approves/rejects the promotion"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Multi-Level Approval"
                    secondary="Multiple approvers in sequence (e.g., Manager then Finance)"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                You can view the approval status and history in the Approvals tab of any promotion.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Performance Tracking</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Track promotion performance with these key metrics:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">ROI</Typography>
                      <Typography variant="body2">
                        Return on Investment measures profit generated per rand spent
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Uplift</Typography>
                      <Typography variant="body2">
                        Incremental sales above baseline during the promotion period
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Spend Efficiency</Typography>
                      <Typography variant="body2">
                        Actual spend vs planned spend and budget utilization
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Redemption Rate</Typography>
                      <Typography variant="body2">
                        Percentage of eligible customers who participated
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Cloning Promotions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Save time by cloning existing promotions:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Open the promotion you want to clone"
                    secondary="Navigate to the promotion detail page"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Click the Clone button"
                    secondary="Found in the action menu or toolbar"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Optionally shift dates"
                    secondary="Specify number of days to shift all dates forward"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Modify as needed"
                    secondary="The clone is created as a draft - update any details before submitting"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff3e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#ed6c02', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Use simulations before creating"
                  secondary="Run a simulation to predict ROI before committing budget"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Check for conflicts"
                  secondary="The system warns if products/customers overlap with other active promotions"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Set realistic targets"
                  secondary="Use historical data to set achievable uplift targets"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Document everything"
                  secondary="Add notes and attach supporting documents for audit trail"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/promotions')}>
                <ListItemText primary="View All Promotions" />
              </ListItem>
              <ListItem button onClick={() => navigate('/promotions/new')}>
                <ListItemText primary="Create New Promotion" />
              </ListItem>
              <ListItem button onClick={() => navigate('/approvals')}>
                <ListItemText primary="Pending Approvals" />
              </ListItem>
              <ListItem button onClick={() => navigate('/scenarios')}>
                <ListItemText primary="Simulation Studio" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Common Mistakes</Typography>
            <Typography variant="body2">
              Avoid setting promotion dates that overlap with existing promotions for the same products/customers.
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/help')}
        >
          Back to Help Center
        </Button>
      </Box>
    </Container>
  );
};

export default PromotionsHelp;
