import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, MenuItem, Grid, Paper, Chip,
  CircularProgress, InputAdornment, alpha,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Inventory as InventoryIcon,
  Category as CategoryIcon, AttachMoney as PriceIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: 'all' });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);
      const response = await api.get(`/products?${params}`);
      if (response.data.success) {
        const normalizedProducts = (response.data.data || []).map(product => ({
          ...product,
          category: typeof product.category === 'object' ? (product.category?.primary || 'Uncategorized') : product.category,
          brand: typeof product.brand === 'object' ? (product.brand?.name || 'Unknown') : product.brand
        }));
        setProducts(normalizedProducts);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);

  const stats = useMemo(() => {
    const total = products.length;
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))].length;
    const avgPrice = total > 0 ? products.reduce((s, p) => s + (p.unitPrice || 0), 0) / total : 0;
    return { total, categories, avgPrice };
  }, [products]);

  const summaryCards = [
    { label: 'Total Products', value: stats.total, icon: <InventoryIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Categories', value: stats.categories, icon: <CategoryIcon />, color: '#059669', bg: alpha('#059669', 0.08) },
    { label: 'Avg Price', value: formatCurrency(stats.avgPrice), icon: <PriceIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Products</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>{products.length} product{products.length !== 1 ? 's' : ''}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3, py: 1.2, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
          New Product
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
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

      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField fullWidth placeholder="Search products..." value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }} />
        <TextField select label="Category" value={filters.category}
          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}>
          <MenuItem value="all">All Categories</MenuItem>
          <MenuItem value="Beverages">Beverages</MenuItem>
          <MenuItem value="Snacks">Snacks</MenuItem>
          <MenuItem value="Dairy">Dairy</MenuItem>
          <MenuItem value="Bakery">Bakery</MenuItem>
          <MenuItem value="Frozen">Frozen</MenuItem>
        </TextField>
      </Paper>

      {products.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, borderRadius: '16px', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" mb={2}>No products found</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/products/new')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add Product
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {products.map(product => (
            <Grid item xs={12} sm={6} md={4} key={product.id || product._id}>
              <Paper elevation={0}
                sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column',
                  '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)', borderColor: '#7C3AED', transform: 'translateY(-2px)' } }}
                onClick={() => navigate(`/products/${product.id || product._id}`)}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: alpha('#059669', 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InventoryIcon sx={{ color: '#059669', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{product.name || product.productName}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">SKU</Typography>
                    <Typography variant="caption" fontWeight={600}>{product.sku || product.productCode}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">Category</Typography>
                    <Chip label={product.category} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px' }} />
                  </Box>
                  {product.brand && (
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="caption" color="text.secondary">Brand</Typography>
                      <Typography variant="caption" fontWeight={600}>{product.brand}</Typography>
                    </Box>
                  )}
                  <Box sx={{ p: 1.5, bgcolor: alpha('#059669', 0.06), borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: product.inventory ? 1.5 : 0 }}>
                    <Typography variant="caption" fontWeight={600} color="#059669">Price</Typography>
                    <Typography variant="caption" fontWeight={700} color="#059669">{formatCurrency(product.unitPrice)}</Typography>
                  </Box>
                  {product.inventory && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Stock</Typography>
                      <Typography variant="caption" fontWeight={600}>{product.inventory.availableQuantity || 0} units</Typography>
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

export default ProductList;
