import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button, Breadcrumbs, Link,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Info as InfoIcon,
  Lightbulb as TipIcon, ArrowBack as BackIcon, Security as RolesIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RolesHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>Help Center</Link>
        <Typography color="text.primary">Role Management</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#388e3c', borderRadius: 2, p: 1.5, mr: 2 }}>
          <RolesIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Role Management Help</Typography>
          <Typography variant="body1" color="text.secondary">Configure roles, permissions, and user access</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Role Management controls who can access what in TRADEAI. Define roles with specific
              permissions, assign users to roles, and create permission groups for fine-grained access control.
              The system supports hierarchical roles with approval amount limits.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Creating Roles</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Role Name & Type" secondary="Define a descriptive name and select system or custom role type" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Permission Assignment" secondary="Select which modules the role can access (read, create, update, delete per module)" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Approval Limits" secondary="Set the maximum amount this role can approve without escalation" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Role Hierarchy" secondary="Set the role level (1=highest) and parent role for escalation paths" /></ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Default Roles</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {[
                  { title: 'Super Admin', desc: 'Full system access — all modules, all actions' },
                  { title: 'Finance Manager', desc: 'Budgets, claims, settlements, accruals, P&L view' },
                  { title: 'Trade Marketing Manager', desc: 'Promotions, budgets, campaigns, trade spends' },
                  { title: 'Key Account Manager', desc: 'Promotions (read/create), customers, trade spends' },
                  { title: 'Analyst', desc: 'Read-only access to analytics, reports, dashboards' },
                  { title: 'Auditor', desc: 'Audit trails, compliance reports, document read access' },
                ].map((r) => (
                  <Grid item xs={6} key={r.title}>
                    <Card variant="outlined"><CardContent>
                      <Typography variant="subtitle2" color="primary">{r.title}</Typography>
                      <Typography variant="body2">{r.desc}</Typography>
                    </CardContent></Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">User Assignments</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Assign Users" secondary="From the User Roles tab, assign one or more roles to each user" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Validity Period" secondary="Set start and end dates for temporary role assignments" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Permission Groups" secondary="Create reusable permission groups that can be assigned to multiple roles" /></ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>System roles cannot be deleted, but you can create custom roles with any combination of permissions.</Alert>
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
              <ListItem><ListItemText primary="Principle of least privilege" secondary="Give users only the permissions they need for their job" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Use permission groups" secondary="Create groups by department for easier management" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Review quarterly" secondary="Audit role assignments every quarter to ensure they're still appropriate" /></ListItem>
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/role-management')}><ListItemText primary="Role Management" /></ListItem>
              <ListItem button onClick={() => navigate('/system-config')}><ListItemText primary="System Configuration" /></ListItem>
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

export default RolesHelp;
