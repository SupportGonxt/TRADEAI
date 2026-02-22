import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button, Breadcrumbs, Link,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Info as InfoIcon,
  Lightbulb as TipIcon, ArrowBack as BackIcon, Notifications as NotifIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotificationsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>Help Center</Link>
        <Typography color="text.primary">Notification Center</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#7C3AED', borderRadius: 2, p: 1.5, mr: 2 }}>
          <NotifIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Notification Center Help</Typography>
          <Typography variant="body1" color="text.secondary">Manage alerts, rules, and notification preferences</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              The Notification Center is your hub for all system alerts, updates, and action items.
              It tracks notifications across all modules — promotions, budgets, claims, deductions,
              approvals, and system events — with priority levels and multi-channel delivery.
            </Typography>
            <Typography variant="body1">
              The centre has three tabs: Notifications (inbox), Alert Rules (configure triggers),
              and Alert History (past alerts with acknowledgement tracking).
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Notifications Inbox</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="View All Notifications" secondary="Summary cards show unread count, high-priority items, and recent alerts. Filter by status, category, or priority." />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Mark as Read / Dismiss" secondary="Click a notification to mark it read, or dismiss it to remove from your active inbox." />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Mark All Read" secondary="Use the bulk action to mark all notifications as read at once." />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Action Links" secondary="Notifications include direct links to the related entity (e.g. a claim or promotion) for quick navigation." />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Alert Rules</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Configure automated alerts that trigger based on business conditions:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Threshold Alerts" secondary="Trigger when a metric exceeds a value (e.g. budget utilisation > 90%)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Trend Alerts" secondary="Trigger on trend changes (e.g. ROI declining for 3 consecutive periods)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Anomaly Alerts" secondary="AI-driven detection of unusual patterns in data" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Schedule Alerts" secondary="Recurring alerts on a fixed schedule (daily, weekly)" />
                </ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Each rule has a cooldown period to prevent alert fatigue — the same alert won't fire again until the cooldown expires.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Alert History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>Track and manage past alerts:</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card variant="outlined"><CardContent>
                    <Typography variant="subtitle2" color="primary">Triggered</Typography>
                    <Typography variant="body2">Alert fired but not yet reviewed</Typography>
                  </CardContent></Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined"><CardContent>
                    <Typography variant="subtitle2" color="warning.main">Acknowledged</Typography>
                    <Typography variant="body2">Someone has seen and accepted the alert</Typography>
                  </CardContent></Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined"><CardContent>
                    <Typography variant="subtitle2" color="success.main">Resolved</Typography>
                    <Typography variant="body2">Root cause addressed, alert closed</Typography>
                  </CardContent></Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined"><CardContent>
                    <Typography variant="subtitle2" color="error">Escalated</Typography>
                    <Typography variant="body2">Alert sent to higher authority for action</Typography>
                  </CardContent></Card>
                </Grid>
              </Grid>
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
              <ListItem><ListItemText primary="Set severity carefully" secondary="Use Critical only for revenue-impacting events to avoid alert fatigue" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Use cooldown periods" secondary="Prevent repeated alerts for the same ongoing issue" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Review rules monthly" secondary="Disable rules that trigger too often without action" /></ListItem>
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/notification-center')}><ListItemText primary="Notification Center" /></ListItem>
              <ListItem button onClick={() => navigate('/approvals')}><ListItemText primary="Pending Approvals" /></ListItem>
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

export default NotificationsHelp;
