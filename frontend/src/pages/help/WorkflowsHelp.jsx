import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button, Breadcrumbs, Link,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Info as InfoIcon,
  Lightbulb as TipIcon, ArrowBack as BackIcon, AccountTree as WorkflowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const WorkflowsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>Help Center</Link>
        <Typography color="text.primary">Workflow Engine</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#7b1fa2', borderRadius: 2, p: 1.5, mr: 2 }}>
          <WorkflowIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Workflow Engine Help</Typography>
          <Typography variant="body1" color="text.secondary">Design, run, and track approval workflows</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              The Workflow Engine automates approval processes across TRADEAI. Define templates
              with multi-step approval chains, set conditions and SLA targets, and track every
              instance from initiation to completion. Supports auto-approval thresholds and escalation rules.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Workflow Templates</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Define Steps" secondary="Create multi-step workflows with Manager Review, Finance Review, and Final Approval stages" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Set Triggers" secondary="Choose when the workflow starts: on create, on submit, on threshold breach, or on schedule" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Auto-Approve Rules" secondary="Set a monetary threshold below which items are auto-approved without manual review" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Escalation Rules" secondary="Define what happens if an approver doesn't act within the SLA window" /></ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Workflow Instances</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                When a workflow is triggered, an instance is created and progresses through its steps:
              </Typography>
              <Grid container spacing={2}>
                {[
                  { title: 'Pending', desc: 'Workflow created, waiting for first step to begin', color: '#9e9e9e' },
                  { title: 'In Progress', desc: 'Currently moving through approval steps', color: '#0288d1' },
                  { title: 'Completed', desc: 'All steps done, outcome recorded (approved/rejected)', color: '#2e7d32' },
                  { title: 'Rejected', desc: 'An approver rejected — workflow stopped', color: '#d32f2f' },
                  { title: 'Escalated', desc: 'SLA breached — sent to higher authority', color: '#ed6c02' },
                ].map((s) => (
                  <Grid item xs={6} key={s.title}>
                    <Card variant="outlined"><CardContent>
                      <Typography variant="subtitle2" sx={{ color: s.color }}>{s.title}</Typography>
                      <Typography variant="body2">{s.desc}</Typography>
                    </CardContent></Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">SLA Tracking</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Step-Level SLAs" secondary="Each step has a due date based on the template's SLA hours" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Overdue Detection" secondary="Steps that exceed their SLA are flagged as overdue automatically" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Duration Tracking" secondary="Total workflow duration (hours) is recorded for performance analysis" /></ListItem>
              </List>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Overdue workflows appear in the notification center and can trigger escalation alerts.
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
              <ListItem><ListItemText primary="Keep workflows short" secondary="3-4 steps maximum — more steps means longer cycle times" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Use auto-approve wisely" secondary="Set thresholds for low-risk items to reduce bottlenecks" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Monitor SLA compliance" secondary="Track average completion times and identify bottleneck steps" /></ListItem>
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/workflow-engine')}><ListItemText primary="Workflow Engine" /></ListItem>
              <ListItem button onClick={() => navigate('/approvals')}><ListItemText primary="Approvals" /></ListItem>
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

export default WorkflowsHelp;
