import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Tabs, Tab, Button, Paper, Chip, Skeleton } from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../../services/api/apiClient';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';
import { usePageVariants } from '../../hooks/usePageVariants';

import CampaignOverview from './tabs/CampaignOverview';
import CampaignBudget from './tabs/CampaignBudget';
import CampaignPerformance from './tabs/CampaignPerformance';
import CampaignHistory from './tabs/CampaignHistory';

const CampaignDetailWithTabs = () => {
  const { id, tab = 'overview' } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  const pageVariant = usePageVariants('campaignDetail');
  const tabs = pageVariant?.tabs || [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'budget', label: 'Budget', path: 'budget' },
    { id: 'performance', label: 'Performance', path: 'performance' },
    { id: 'history', label: 'History', path: 'history' }
  ];

  useEffect(() => {
    loadCampaign();
    analytics.trackPageView('campaign_detail', { campaignId: id, tab: activeTab });
  }, [id]);

  useEffect(() => {
    setActiveTab(tab || 'overview');
  }, [tab]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/campaigns/${id}`);
      setCampaign(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/campaigns/${id}/${newValue}`);
    analytics.trackEvent('campaign_tab_changed', { campaignId: id, tab: newValue });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">Campaign not found</Typography>
      </Container>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/campaigns')}
            sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            Back to Campaigns
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">{campaign.name}</Typography>
                <Chip label={formatLabel(campaign.status)} color={campaign.status === 'active' ? 'success' : campaign.status === 'approved' ? 'info' : campaign.status === 'draft' ? 'default' : 'warning'} sx={{ fontWeight: 600 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">{campaign.campaignCode}</Typography>
            </Box>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/campaigns/${id}/edit`)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>Edit</Button>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem', minHeight: 56 } }}>
            {tabs.map((tab) => (
              <Tab key={tab.id} value={tab.path} label={tab.label} />
            ))}
          </Tabs>
        </Paper>

        <Box>
          {activeTab === 'overview' && <CampaignOverview campaign={campaign} onUpdate={loadCampaign} />}
          {activeTab === 'promotions' && <CampaignHistory campaignId={id} campaign={campaign} />}
          {activeTab === 'budget' && <CampaignBudget campaignId={id} campaign={campaign} />}
          {activeTab === 'performance' && <CampaignPerformance campaignId={id} campaign={campaign} />}
          {activeTab === 'history' && <CampaignHistory campaignId={id} campaign={campaign} />}
          {activeTab === 'vendor-funding' && <CampaignBudget campaignId={id} campaign={campaign} />}
          {activeTab === 'offers' && <CampaignOverview campaign={campaign} onUpdate={loadCampaign} />}
          {activeTab === 'execution' && <CampaignPerformance campaignId={id} campaign={campaign} />}
        </Box>
      </Container>
  );
};

export default CampaignDetailWithTabs;
