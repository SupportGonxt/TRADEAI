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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ArrowBack as BackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingIcon,
  Assessment as ReportIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AnalyticsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>
          Help Center
        </Link>
        <Typography color="text.primary">Analytics & Insights</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#d32f2f', borderRadius: 2, p: 1.5, mr: 2 }}>
          <AnalyticsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Analytics & Insights Help</Typography>
          <Typography variant="body1" color="text.secondary">
            Learn how to analyze performance and gain actionable insights
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              TRADEAI provides comprehensive analytics to help you understand promotion performance, 
              budget efficiency, and customer behavior. The analytics suite includes real-time 
              dashboards, detailed reports, and AI-powered insights.
            </Typography>
            <Typography variant="body1">
              Use analytics to identify what's working, optimize future promotions, and demonstrate 
              ROI to stakeholders.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Key Performance Indicators (KPIs)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">ROI (Return on Investment)</Typography>
                      <Typography variant="body2">
                        Measures profit generated per rand of trade spend. Formula: (Incremental Revenue - Trade Spend) / Trade Spend
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Uplift</Typography>
                      <Typography variant="body2">
                        Incremental sales above baseline during promotion. Shows true promotion impact.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Budget Utilization</Typography>
                      <Typography variant="body2">
                        Percentage of allocated budget that has been spent. Tracks spending pace.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">Spend Efficiency</Typography>
                      <Typography variant="body2">
                        Revenue generated per rand of trade spend. Higher is better.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Dashboards</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Executive Dashboard"
                    secondary="High-level KPIs, trends, and alerts for leadership"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="KAM Dashboard"
                    secondary="Account-specific metrics and action items for Key Account Managers"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Finance Dashboard"
                    secondary="Budget tracking, accruals, and reconciliation status"
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="AI Insights Dashboard"
                    secondary="AI-generated recommendations and anomaly detection"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Reports</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Generate detailed reports for analysis and stakeholder communication:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><ReportIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Promotion Performance Report"
                    secondary="Detailed analysis of individual promotion results"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ReportIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Budget Utilization Report"
                    secondary="Budget vs actual spend by period, customer, or category"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ReportIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Customer Performance Report"
                    secondary="Trade spend and ROI by customer or customer group"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ReportIcon color="primary" /></ListItemIcon>
                  <ListItemText 
                    primary="Variance Analysis Report"
                    secondary="Plan vs actual with variance explanations"
                  />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Reports can be exported to CSV or PDF. Schedule recurring reports for automatic delivery.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">AI-Powered Insights</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                TRADEAI uses AI to surface actionable insights:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Next Best Action"
                    secondary="AI recommends the most impactful actions to take"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Anomaly Detection"
                    secondary="Alerts when metrics deviate significantly from expected"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Trend Analysis"
                    secondary="Identifies emerging patterns in performance data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TrendingIcon color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Optimization Suggestions"
                    secondary="Recommends budget reallocation for better ROI"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Baseline Methodology</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Accurate baselines are essential for measuring true promotion uplift:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Historical Average"
                    secondary="Uses average sales from comparable non-promoted periods"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Year-over-Year"
                    secondary="Compares to same period last year, adjusted for growth"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Trend-Based"
                    secondary="Projects baseline using recent sales trend"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText 
                    primary="Control Group"
                    secondary="Uses non-promoted stores/regions as baseline reference"
                  />
                </ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Configure baseline methodology in Governance > Baseline Configuration.
              </Alert>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#ffebee' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TipIcon sx={{ color: '#d32f2f', mr: 1 }} />
              <Typography variant="h6">Pro Tips</Typography>
            </Box>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Set up alerts"
                  secondary="Get notified when KPIs exceed thresholds"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Compare periods"
                  secondary="Use date range filters to compare performance"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Drill down"
                  secondary="Click charts to see underlying detail"
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText 
                  primary="Export for presentations"
                  secondary="Download charts and data for stakeholder meetings"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/dashboard')}>
                <ListItemText primary="Main Dashboard" />
              </ListItem>
              <ListItem button onClick={() => navigate('/dashboard')}>
                <ListItemText primary="AI Insights" />
              </ListItem>
              <ListItem button onClick={() => navigate('/reports')}>
                <ListItemText primary="Reports" />
              </ListItem>
              <ListItem button onClick={() => navigate('/analytics')}>
                <ListItemText primary="Variance Analysis" />
              </ListItem>
            </List>
          </Paper>

          <Alert severity="info">
            <Typography variant="subtitle2">Data Refresh</Typography>
            <Typography variant="body2">
              Analytics data refreshes every 15 minutes. Last refresh time shown in dashboard header.
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

export default AnalyticsHelp;
