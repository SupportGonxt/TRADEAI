import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Alert, Button, Breadcrumbs, Link,
  Card, CardContent, Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, CheckCircle as CheckIcon, Info as InfoIcon,
  Lightbulb as TipIcon, ArrowBack as BackIcon, Description as DocsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DocumentsHelp = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/help')}>Help Center</Link>
        <Typography color="text.primary">Document Management</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ bgcolor: '#0288d1', borderRadius: 2, p: 1.5, mr: 2 }}>
          <DocsIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Document Management Help</Typography>
          <Typography variant="body1" color="text.secondary">Store, version, and manage trade documents</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Typography variant="body1" paragraph>
              Document Management provides a centralised repository for all trade-related documents —
              contracts, invoices, reports, policies, and agreements. Each document supports versioning,
              access control, and full audit trail.
            </Typography>
            <Typography variant="body1">
              Documents can be linked to specific entities (promotions, customers, claims) for easy
              cross-referencing and compliance tracking.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Uploading Documents</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 1: Click New Document" secondary="Open the Documents page and click the add button in the top-right corner" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 2: Fill Metadata" secondary="Enter name, type (contract/invoice/report/policy), category, and description" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 3: Link to Entity" secondary="Optionally link to a promotion, customer, or claim for cross-referencing" /></ListItem>
                <ListItem><ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Step 4: Add Tags" secondary="Tag documents for easy searching and filtering later" /></ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Version Control</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Every document update creates a new version. The system tracks:
              </Typography>
              <List>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Version Number" secondary="Automatically incremented with each upload" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Change Summary" secondary="Description of what changed in this version" /></ListItem>
                <ListItem><ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                  <ListItemText primary="Upload History" secondary="Who uploaded each version and when" /></ListItem>
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>Previous versions are always accessible — nothing is permanently deleted.</Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Document Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {[
                  { title: 'Contracts', desc: 'Retailer agreements, terms of trade, annual deals' },
                  { title: 'Invoices', desc: 'Settlement invoices, credit notes, debit notes' },
                  { title: 'Reports', desc: 'Performance reports, compliance reports, audit reports' },
                  { title: 'Policies', desc: 'Trade policies, pricing policies, promotion guidelines' },
                  { title: 'Agreements', desc: 'Customer agreements, rebate agreements, co-op terms' },
                  { title: 'Presentations', desc: 'JBP presentations, review decks, proposals' },
                ].map((dt) => (
                  <Grid item xs={6} key={dt.title}>
                    <Card variant="outlined"><CardContent>
                      <Typography variant="subtitle2" color="primary">{dt.title}</Typography>
                      <Typography variant="body2">{dt.desc}</Typography>
                    </CardContent></Card>
                  </Grid>
                ))}
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
              <ListItem><ListItemText primary="Use consistent naming" secondary="Include date and entity in document names for easy searching" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Set expiry dates" secondary="Mark contracts with expiry dates to get renewal reminders" /></ListItem>
              <Divider component="li" />
              <ListItem><ListItemText primary="Tag everything" secondary="Tags make bulk filtering much faster than searching by name" /></ListItem>
            </List>
          </Paper>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Links</Typography>
            <List dense>
              <ListItem button onClick={() => navigate('/document-management')}><ListItemText primary="Document Management" /></ListItem>
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

export default DocumentsHelp;
