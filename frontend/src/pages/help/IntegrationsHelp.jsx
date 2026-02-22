import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button, Breadcrumbs, Link,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Info as InfoIcon,
  Lightbulb as TipIcon, ArrowBack as BackIcon, Hub as HubIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const IntegrationsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>Help Center</Link>
        <Typography color="text.primary">Integration Hub</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#ed6c02', borderRadius: 2, p: 1.5, mr: 2 }}>
          <HubIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Integration Hub Help</Typography>
          <Typography variant="body1" color="text.secondary">Connect external systems and manage data sync</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              The Integration Hub connects TRADEAI to your external systems — ERP (SAP, Oracle),
              CRM (Salesforce), POS systems, data warehouses, and file-based imports. It manages
              connection configuration, sync scheduling, and detailed logging.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Setting Up an Integration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 1: Select Provider" secondary="Choose from supported providers (SAP, Salesforce, Oracle, Azure Data Factory, SFTP)" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 2: Configure Connection" secondary="Enter endpoint URL, authentication type (OAuth2, API Key, Basic, Certificate), and credentials" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 3: Set Sync Frequency" secondary="Choose realtime, hourly, daily, or weekly sync intervals" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 4: Test Connection" secondary="Run a test sync to verify connectivity before going live" /></ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Integration Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {[
                  { title: 'ERP', desc: 'Sync customers, products, invoices, and financial data from SAP/Oracle' },
                  { title: 'CRM', desc: 'Import customer contacts, opportunities, and account data from Salesforce' },
                  { title: 'POS', desc: 'Pull point-of-sale transaction data for promotion performance tracking' },
                  { title: 'Data Warehouse', desc: 'Connect to Azure/AWS data warehouses for analytics feeds' },
                  { title: 'File Transfer', desc: 'SFTP-based CSV/Excel file imports and exports on schedule' },
                ].map((t) => (
                  <Grid item xs={6} key={t.title}>
                    <Card variant="outlined"><CardContent>
                      <Typography variant="subtitle2" color="primary">{t.title}</Typography>
                      <Typography variant="body2">{t.desc}</Typography>
                    </CardContent></Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Sync Logs & Troubleshooting</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>Every sync operation is logged with:</Typography>
              <List>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Records Processed / Failed" secondary="Total records synced and any that failed with error details" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Duration" secondary="How long the sync took in milliseconds" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Error Messages" secondary="Detailed error messages for failed syncs to aid troubleshooting" /></ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                If an integration shows repeated errors, check credentials and endpoint availability before contacting support.
              </Alert>
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
              <ListItem><ListItemText primary="Start with daily syncs" secondary="Move to real-time only after verifying data quality" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Monitor error counts" secondary="Set alert rules for integration failures to catch issues early" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Use test mode first" secondary="Always test with a small dataset before enabling full sync" /></ListItem>
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/integration-hub')}><ListItemText primary="Integration Hub" /></ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/help')}>Back to Help Center</Button>
      </Box>
    </Container>
  );
};

export default IntegrationsHelp;
