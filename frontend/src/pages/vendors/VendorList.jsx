import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Grid, Paper, CircularProgress,
  InputAdornment, alpha,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Business as BusinessIcon,
  Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
  Groups as VendorsIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const VendorList = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const params = search ? `?search=${search}` : '';
        const response = await api.get(`/vendors${params}`);
        setVendors(response.data?.data || response.data || []);
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [search]);

  const stats = useMemo(() => ({
    total: vendors.length,
    withContact: vendors.filter(v => v.contactEmail || v.email || v.contactPhone || v.phone).length,
  }), [vendors]);

  const summaryCards = [
    { label: 'Total Vendors', value: stats.total, icon: <VendorsIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'With Contact Info', value: stats.withContact, icon: <EmailIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Vendors</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vendors/new')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          New Vendor
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={6} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <TextField fullWidth placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} />
      </Paper>

      {vendors.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, borderRadius: '16px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" mb={2}>No vendors found</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vendors/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add Vendor
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {vendors.map(vendor => (
            <Grid item xs={12} sm={6} lg={4} key={vendor.id || vendor._id}>
              <Paper elevation={0}
                sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column',
                  '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)', borderColor: '#7C3AED', transform: 'translateY(-2px)' } }}
                onClick={() => navigate(`/vendors/${vendor.id || vendor._id}`)}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#7C3AED', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BusinessIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{vendor.name}</Typography>
                </Box>
                <Box sx={{ mt: 'auto' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">Code</Typography>
                    <Typography variant="caption" fontWeight={600}>{vendor.code}</Typography>
                  </Box>
                  {(vendor.contactName || vendor.contactPerson) && (
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">Contact</Typography>
                      <Typography variant="caption" fontWeight={600}>{vendor.contactName || vendor.contactPerson}</Typography>
                    </Box>
                  )}
                  {(vendor.contactEmail || vendor.email) && (
                    <Box display="flex" alignItems="center" gap={1} mb={1} mt={2}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{vendor.contactEmail || vendor.email}</Typography>
                    </Box>
                  )}
                  {(vendor.contactPhone || vendor.phone) && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">{vendor.contactPhone || vendor.phone}</Typography>
                    </Box>
                  )}
                  {(vendor.city || vendor.location) && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: alpha('#7C3AED', 0.06), borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                      <Typography variant="caption" color="#7C3AED">
                        {vendor.city || vendor.location?.city}{(vendor.city || vendor.location?.city) && (vendor.region || vendor.location?.state) ? ', ' : ''}{vendor.region || vendor.location?.state}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default VendorList;
