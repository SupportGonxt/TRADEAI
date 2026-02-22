import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button, Breadcrumbs, Link,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Info as InfoIcon,
  Lightbulb as TipIcon, ArrowBack as BackIcon, Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SystemConfigHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>Help Center</Link>
        <Typography color="text.primary">System Configuration</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#616161', borderRadius: 2, p: 1.5, mr: 2 }}>
          <SettingsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>System Configuration Help</Typography>
          <Typography variant="body1" color="text.secondary">Manage system settings and tenant configuration</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              System Configuration lets administrators manage global settings, module-specific
              configuration, and tenant management. Settings are organised by category (general,
              approvals, notifications, promotions, budgets, security) and support different data types.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Configuration Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>Key configuration categories:</Typography>
              <Grid container spacing={2}>
                {[
                  { title: 'General', desc: 'Company name, currency, timezone, fiscal year start' },
                  { title: 'Approvals', desc: 'Auto-approve thresholds, maximum approval levels' },
                  { title: 'Notifications', desc: 'Email/SMS delivery toggles, default channels' },
                  { title: 'Promotions', desc: 'Default currency, approval requirements' },
                  { title: 'Budgets', desc: 'Fiscal year, allocation methods' },
                  { title: 'Security', desc: 'Session timeouts, password policies' },
                ].map((c) => (
                  <Grid item xs={6} key={c.title}>
                    <Card variant="outlined"><CardContent>
                      <Typography variant="subtitle2" color="primary">{c.title}</Typography>
                      <Typography variant="body2">{c.desc}</Typography>
                    </CardContent></Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Tenant Management</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Multi-Tenancy" secondary="Each tenant (company) has isolated data, settings, and user access" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Subscription Plans" secondary="Track plan type (free/starter/professional/enterprise), user limits, and storage" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Feature Flags" secondary="Enable or disable specific modules per tenant" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Branding" secondary="Custom logo and primary colour per tenant" /></ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Only Super Admins can access tenant management settings.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Setting Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="String" secondary="Text values like company name, currency codes" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Number" secondary="Numeric values like thresholds, timeouts, limits" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Boolean" secondary="On/off toggles for feature flags and settings" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Read-Only" secondary="Some settings (like company name) can only be changed by super admins" /></ListItem>
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
              <ListItem><ListItemText primary="Document changes" secondary="Always note why a setting was changed for audit purposes" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Test in staging first" secondary="Change settings in a test environment before production" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Review sensitive settings" secondary="Settings marked as sensitive are masked in the UI for security" /></ListItem>
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/system-config')}><ListItemText primary="System Configuration" /></ListItem>
              <ListItem button onClick={() => navigate('/role-management')}><ListItemText primary="Role Management" /></ListItem>
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

export default SystemConfigHelp;
