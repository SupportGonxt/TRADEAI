import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Paper,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Campaign as PromotionsIcon,
  AccountBalance as BudgetsIcon,
  Receipt as TradeSpendIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  Analytics as AnalyticsIcon,
  Science as SimulationIcon,
  Approval as ApprovalsIcon,
  PlayCircle as VideoIcon,
  MenuBook as GuideIcon,
  School as TrainingIcon,
  Help as HelpIcon,
  Percent as RebatesIcon,
  ReceiptLong as ClaimsIcon,
  RemoveCircle as DeductionsIcon,
  TrendingUp as ForecastingIcon,
  Notifications as NotifIcon,
  Description as DocsIcon,
  Hub as HubIcon,
  Security as RolesIcon,
  AccountTree as WorkflowIcon,
  Settings as ConfigIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const helpSections = [
  {
    id: 'promotions',
    title: 'Promotions',
    icon: PromotionsIcon,
    color: '#7C3AED',
    description: 'Create, manage, and track trade promotions',
    path: '/help/promotions',
    topics: ['Creating promotions', 'Promotion types', 'Approval workflow', 'Performance tracking'],
  },
  {
    id: 'budgets',
    title: 'Budgets',
    icon: BudgetsIcon,
    color: '#2e7d32',
    description: 'Plan and manage trade spend budgets',
    path: '/help/budgets',
    topics: ['Budget planning', 'Allocation', 'Utilization tracking', 'Forecasting'],
  },
  {
    id: 'trade-spends',
    title: 'Trade Spends',
    icon: TradeSpendIcon,
    color: '#ed6c02',
    description: 'Track and reconcile trade spend activities',
    path: '/help/trade-spends',
    topics: ['Creating trade spends', 'Approval process', 'Accruals', 'Reconciliation'],
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: CustomersIcon,
    color: '#9c27b0',
    description: 'Manage customer relationships and hierarchies',
    path: '/help/customers',
    topics: ['Customer setup', 'Hierarchies', 'Tiers', 'Customer 360'],
  },
  {
    id: 'products',
    title: 'Products',
    icon: ProductsIcon,
    color: '#0288d1',
    description: 'Manage product catalog and hierarchies',
    path: '/help/products',
    topics: ['Product setup', 'Categories', 'Pricing', 'Hierarchies'],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: AnalyticsIcon,
    color: '#d32f2f',
    description: 'Analyze performance and gain insights',
    path: '/help/analytics',
    topics: ['Dashboards', 'Reports', 'KPIs', 'Trends'],
  },
  {
    id: 'simulations',
    title: 'Simulations',
    icon: SimulationIcon,
    color: '#7b1fa2',
    description: 'Run what-if scenarios and optimize promotions',
    path: '/help/simulations',
    topics: ['Scenario planning', 'ROI optimization', 'Constraints', 'Recommendations'],
  },
  {
    id: 'approvals',
    title: 'Approvals',
    icon: ApprovalsIcon,
    color: '#388e3c',
    description: 'Manage approval workflows',
    path: '/help/approvals',
    topics: ['Approval queues', 'Delegation', 'Escalation', 'Audit trail'],
  },
  {
    id: 'rebates',
    title: 'Rebates',
    icon: RebatesIcon,
    color: '#7b1fa2',
    description: 'Create and manage rebate programs',
    path: '/help/rebates',
    topics: ['Rebate types', 'Calculation methods', 'Accruals', 'Settlement'],
  },
  {
    id: 'claims',
    title: 'Claims',
    icon: ClaimsIcon,
    color: '#d32f2f',
    description: 'Manage customer claims and matching',
    path: '/help/claims',
    topics: ['Claim types', 'Review process', 'Deduction matching', 'Settlement'],
  },
  {
    id: 'deductions',
    title: 'Deductions',
    icon: DeductionsIcon,
    color: '#f57c00',
    description: 'Track and resolve customer deductions',
    path: '/help/deductions',
    topics: ['Investigation', 'Auto-matching', 'Dispute resolution', 'Aging'],
  },
  {
    id: 'forecasting',
    title: 'Forecasting',
    icon: ForecastingIcon,
    color: '#0288d1',
    description: 'Create and analyze forecasts',
    path: '/help/forecasting',
    topics: ['Forecast types', 'Methods', 'Variance analysis', 'AI predictions'],
  },
  {
    id: 'notifications',
    title: 'Notification Center',
    icon: NotifIcon,
    color: '#7C3AED',
    description: 'Manage alerts, rules, and notification preferences',
    path: '/help/notifications',
    topics: ['Alert rules', 'Notification inbox', 'Multi-channel delivery', 'Alert history'],
  },
  {
    id: 'documents',
    title: 'Document Management',
    icon: DocsIcon,
    color: '#0288d1',
    description: 'Store, version, and manage trade documents',
    path: '/help/documents',
    topics: ['Upload documents', 'Version control', 'Access control', 'Audit trail'],
  },
  {
    id: 'integrations',
    title: 'Integration Hub',
    icon: HubIcon,
    color: '#ed6c02',
    description: 'Connect external systems and manage data sync',
    path: '/help/integrations',
    topics: ['ERP/CRM sync', 'Connection setup', 'Sync logs', 'Troubleshooting'],
  },
  {
    id: 'roles',
    title: 'Role Management',
    icon: RolesIcon,
    color: '#388e3c',
    description: 'Configure roles, permissions, and user access',
    path: '/help/roles',
    topics: ['Creating roles', 'Permission groups', 'User assignments', 'Approval limits'],
  },
  {
    id: 'workflows',
    title: 'Workflow Engine',
    icon: WorkflowIcon,
    color: '#7b1fa2',
    description: 'Design, run, and track approval workflows',
    path: '/help/workflows',
    topics: ['Workflow templates', 'Instances', 'SLA tracking', 'Escalation'],
  },
  {
    id: 'system-config',
    title: 'System Configuration',
    icon: ConfigIcon,
    color: '#616161',
    description: 'Manage system settings and tenant configuration',
    path: '/help/system-config',
    topics: ['Settings management', 'Tenant setup', 'Feature flags', 'Security'],
  },
];

const quickStartGuides = [
  {
    title: 'Navigating the New UI',
    duration: '3 min',
    description: 'Learn the icon sidebar, top header, and mobile drawer navigation in the updated TRADEAI interface',
    type: 'guide',
  },
  {
    title: 'Creating Your First Promotion',
    duration: '10 min',
    description: 'Use the Promotions page to create a promotion — fill in the form, submit for approval, and track status via card-based views',
    type: 'guide',
  },
  {
    title: 'Understanding Budget Allocation',
    duration: '8 min',
    description: 'View budget summary cards, track utilization with progress bars, and manage allocations from the Budgets page',
    type: 'guide',
  },
  {
    title: 'Running a Simulation',
    duration: '7 min',
    description: 'Use the Simulation Studio to model what-if scenarios, compare ROI across options, and optimize before committing budget',
    type: 'video',
  },
  {
    title: 'Setting Up Rebate Agreements',
    duration: '12 min',
    description: 'Create rebate programs from the Rebates page — define calculation methods, thresholds, and track accruals',
    type: 'guide',
  },
  {
    title: 'Managing Claims and Deductions',
    duration: '10 min',
    description: 'Process claims and match to deductions using tab-based filtering, auto-match, and card-based record views',
    type: 'guide',
  },
  {
    title: 'Creating Forecasts',
    duration: '8 min',
    description: 'Generate AI-powered forecasts from the Forecasting page — select algorithms, set parameters, and review predictions',
    type: 'guide',
  },
  {
    title: 'Approval Workflow Overview',
    duration: '6 min',
    description: 'Review pending approvals, approve or reject with one click, and track audit trails from the Approvals page',
    type: 'video',
  },
  {
    title: 'Setting Up Notifications & Alerts',
    duration: '8 min',
    description: 'Configure alert rules for budget thresholds, claim deadlines, and promotion milestones — receive alerts in-app, email, or SMS',
    type: 'guide',
  },
  {
    title: 'Managing Documents & Versions',
    duration: '6 min',
    description: 'Upload contracts, invoices, and reports — track versions, set expiry dates, and link documents to promotions or customers',
    type: 'guide',
  },
  {
    title: 'Connecting External Systems',
    duration: '10 min',
    description: 'Set up integrations with SAP, Salesforce, or file-based imports — configure sync schedules and monitor logs',
    type: 'guide',
  },
  {
    title: 'Configuring Roles & Workflows',
    duration: '12 min',
    description: 'Create custom roles with fine-grained permissions, design multi-step approval workflows with SLA tracking and escalation',
    type: 'video',
  },
];

const faqs = [
  {
    question: 'How do I navigate the platform?',
    answer: 'Use the icon sidebar on the left to switch between modules — hover over any icon to see its label. On mobile devices, tap the menu icon (top-left) to open the navigation drawer with expandable sections.',
  },
  {
    question: 'How do I create a new promotion?',
    answer: 'Click the Promotions icon in the sidebar, then click the "New Promotion" button (top-right). Fill in the promotion details including name, type, dates, products, and customers. Submit for approval when ready.',
  },
  {
    question: 'What is the difference between trade spend types?',
    answer: 'Cash Co-op is direct payment to retailers, Off-Invoice is a discount on invoices, Scan Rebate is based on POS data, and Volume Rebate is based on purchase volumes.',
  },
  {
    question: 'How do I track budget utilization?',
    answer: 'Click the Budgets icon in the sidebar. Each budget card shows a utilization progress bar. The summary cards at the top show total allocated, remaining, and percentage used across all budgets.',
  },
  {
    question: 'How do I use the status tabs on list pages?',
    answer: 'Most list pages (Promotions, Budgets, Claims, etc.) have status tabs at the top of the list — click a tab to filter records by status (e.g., All, Active, Planned, Completed). Use the search box to further filter by name.',
  },
  {
    question: 'How do I export data to CSV?',
    answer: 'Click the purple "Export" button in the top header bar. On mobile, open the navigation drawer and use export options from there.',
  },
  {
    question: 'What do the different approval statuses mean?',
    answer: 'Draft: Not yet submitted. Pending: Awaiting approval. Approved: Ready to execute. Rejected: Needs revision. Active: Currently running. Completed: Finished.',
  },
  {
    question: 'How do rebate calculations work?',
    answer: 'Rebates can be calculated as a percentage of sales, a fixed amount, or per unit. The system supports thresholds (minimum qualifying amount) and caps (maximum payout). Accruals are calculated automatically based on sales data.',
  },
  {
    question: 'What is the difference between claims and deductions?',
    answer: 'Claims are requests from customers for payment (e.g., for promotions or rebates). Deductions are amounts customers withhold from invoice payments. The system can automatically match claims to deductions for reconciliation.',
  },
  {
    question: 'How do I create a forecast?',
    answer: 'Click the Forecasting icon in the sidebar, then click "Create New". Select the forecast type (budget, demand, revenue, or volume), choose a forecasting method, and set the parameters. The system will generate predictions based on historical data.',
  },
  {
    question: 'What forecasting methods are available?',
    answer: 'TRADEAI supports Historical Average, Growth Rate, Weighted Moving Average, Manual Entry, and ML-Predicted methods. ML predictions require at least 12 months of historical data for best accuracy.',
  },
  {
    question: 'Can I use TRADEAI on my phone?',
    answer: 'Yes! The platform is fully responsive. On mobile, the sidebar is replaced by a slide-out navigation drawer. All pages, forms, and dashboards adapt to smaller screens. Tap the menu icon in the top-left corner to navigate.',
  },
  {
    question: 'How do I set up alert rules?',
    answer: 'Go to the Notification Center (bell icon in sidebar), click the Alert Rules tab, then Add Rule. Choose the entity type, metric, operator, and threshold. Set severity and delivery channels (in-app, email, SMS).',
  },
  {
    question: 'How does document versioning work?',
    answer: 'Every time you update a document, a new version is created automatically. Previous versions are always accessible from the version history. Each version records who uploaded it, when, and a change summary.',
  },
  {
    question: 'How do I connect my ERP system?',
    answer: 'Go to the Integration Hub (hub icon in sidebar), click Add Integration, select your provider (SAP, Oracle, Salesforce, etc.), enter connection details and credentials, set sync frequency, then test the connection.',
  },
  {
    question: 'What are workflow templates vs instances?',
    answer: 'Templates define the blueprint (steps, approvers, SLAs, escalation rules). Instances are live executions of a template — each promotion or claim that needs approval creates a new instance from the relevant template.',
  },
];

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredSections = helpSections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.topics.some((topic) => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>
          Help & Training Center
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
          Learn how to get the most out of TRADEAI
        </Typography>
        <TextField
          fullWidth
          placeholder="Search for help topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 600 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        centered
        sx={{ mb: 4 }}
      >
        <Tab icon={<GuideIcon />} label="Topics" />
        <Tab icon={<TrainingIcon />} label="Quick Start" />
        <Tab icon={<HelpIcon />} label="FAQs" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {filteredSections.map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(section.path)}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <CardContent sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: section.color,
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          display: 'flex',
                        }}
                      >
                        <section.icon sx={{ color: 'white' }} />
                      </Box>
                      <Typography variant="h6">{section.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {section.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {section.topics.slice(0, 3).map((topic) => (
                        <Chip key={topic} label={topic} size="small" variant="outlined" />
                      ))}
                      {section.topics.length > 3 && (
                        <Chip label={`+${section.topics.length - 3} more`} size="small" />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {quickStartGuides.map((guide, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      bgcolor: guide.type === 'video' ? '#d32f2f' : '#7C3AED',
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {guide.type === 'video' ? (
                      <VideoIcon sx={{ color: 'white' }} />
                    ) : (
                      <GuideIcon sx={{ color: 'white' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{guide.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {guide.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        label={guide.duration}
                        size="small"
                        color={guide.type === 'video' ? 'error' : 'primary'}
                        variant="outlined"
                      />
                      <Button size="small" color="primary">
                        {guide.type === 'video' ? 'Watch' : 'Read'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Box>
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      <Paper sx={{ p: 3, mb: 4, bgcolor: '#F5F3FF' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Business Process Guide
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive guide to TRADEAI workflows, processes, and system integration
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/help/business-process-guide')}
          >
            View Full Guide
          </Button>
        </Box>
      </Paper>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Need more help?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Contact support or browse our documentation
        </Typography>
        <Button variant="outlined" sx={{ mr: 2 }}>
          Contact Support
        </Button>
        <Button variant="contained">
          View Documentation
        </Button>
      </Box>
    </Container>
  );
};

export default HelpCenter;
