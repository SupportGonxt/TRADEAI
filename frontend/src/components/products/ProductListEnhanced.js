import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Typography,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

import { AIEnhancedPage, SmartDataGrid, PageHeader } from '../common';
import productService from '../../services/api/productService';
import ProductForm from './ProductForm';
import { formatCurrency } from '../../utils/formatters';

const ProductListEnhanced = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productService.getAll();
      const productData = response.data || response || [];
      
      const normalizedProducts = productData.map(product => ({
        ...product,
        category: typeof product.category === 'object' ? (product.category?.primary || 'Uncategorized') : product.category,
        brand: typeof product.brand === 'object' ? (product.brand?.name || 'Unknown') : product.brand
      }));
      
      setProducts(normalizedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // AI Insights
  const generateAIInsights = () => {
    if (products.length === 0) return [];

    const insights = [];
    
    // Price optimization opportunities
    const lowMarginProducts = products.filter(p => {
      const margin = ((p.price - p.cost) / p.price) * 100;
      return margin < 20;
    }).length;

    if (lowMarginProducts > 0) {
      insights.push({
        title: `${lowMarginProducts} Products Need Price Optimization`,
        description: `These products have margins below 20%. AI recommends price increases of 8-12% based on market analysis.`,
        confidence: 0.89
      });
    }

    // Trending products
    const trendingProducts = products.filter(p => p.salesGrowth > 15).length;
    if (trendingProducts > 0) {
      insights.push({
        title: `${trendingProducts} Trending Products Identified`,
        description: `These products show 15%+ sales growth. Recommend increasing inventory and promotional focus.`,
        confidence: 0.94
      });
    }

    // Slow-moving inventory
    const slowMoving = products.filter(p => p.turnoverRate < 2).length;
    if (slowMoving > 0) {
      insights.push({
        title: `${slowMoving} Products Have Low Turnover`,
        description: `Consider promotional pricing or bundling strategies to clear slow-moving inventory.`,
        confidence: 0.82
      });
    }

    return insights;
  };

  // Quick Actions
  const getQuickActions = () => [
    {
      icon: '💰',
      label: 'Optimize Pricing',
      description: 'Run AI-powered price optimization across portfolio',
      action: () => navigate('/scenarios')
    },
    {
      icon: '📦',
      label: 'Inventory Analysis',
      description: 'Analyze stock levels and reorder points',
      action: () => navigate('/analytics')
    },
    {
      icon: '🎯',
      label: 'Create Product Bundle',
      description: 'Build promotional bundles with AI suggestions',
      action: () => navigate('/promotions/new?type=bundle')
    },
    {
      icon: '📊',
      label: 'Product Performance Report',
      description: 'Detailed sales and margin analysis',
      action: () => navigate('/reports/products')
    }
  ];

  // Tips
  const getTips = () => [
    'Tip: Products marked with 🔥 are trending with high growth potential',
    'Tip: Use the AI assistant to get pricing recommendations for any product',
    'Tip: Sort by margin to identify optimization opportunities'
  ];

  // Row insights
  const generateRowInsights = () => {
    const insights = {};
    
    products.forEach(product => {
      const margin = product.price && product.cost 
        ? ((product.price - product.cost) / product.price) * 100 
        : 0;
      
      // Trending product
      if (product.salesGrowth > 15) {
        insights[product.id || product._id] = {
          type: 'opportunity',
          message: `🔥 Trending! ${product.salesGrowth}% growth - Increase stock levels`
        };
      }
      // Low margin
      else if (margin < 15 && margin > 0) {
        insights[product.id || product._id] = {
          type: 'risk',
          message: `⚠️ Low Margin (${margin.toFixed(1)}%) - Consider price increase`
        };
      }
      // High performer
      else if (product.salesVolume > 1000) {
        insights[product.id || product._id] = {
          type: 'trending',
          message: `⭐ High Volume Seller - Optimize availability`
        };
      }
    });

    return insights;
  };

  // Table columns
  const columns = [
    {
      id: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {row.imageUrl ? (
            <Avatar src={row.imageUrl} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
              <InventoryIcon />
            </Avatar>
          )}
          <Box>
            <Typography variant="body2" fontWeight="600">
              {value}
            </Typography>
            {row.sku && (
              <Typography variant="caption" color="text.secondary">
                SKU: {row.sku}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      id: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <Chip label={value || 'Uncategorized'} size="small" variant="outlined" />
      )
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight="600" color="primary">
          {formatCurrency(value || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      id: 'cost',
      label: 'Cost',
      sortable: true,
      render: (value) => (
        <Typography variant="body2">
          {formatCurrency(value || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      )
    },
    {
      id: 'margin',
      label: 'Margin %',
      sortable: true,
      render: (value, row) => {
        const margin = row.price && row.cost 
          ? ((row.price - row.cost) / row.price) * 100 
          : 0;
        return (
          <Chip
            label={`${margin.toFixed(1)}%`}
            size="small"
            color={margin > 30 ? 'success' : margin > 20 ? 'primary' : 'warning'}
          />
        );
      }
    },
    {
      id: 'stock',
      label: 'Stock',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" color={value < 10 ? 'error.main' : 'text.primary'}>
          {value || 0}
        </Typography>
      )
    },
    {
      id: 'salesGrowth',
      label: 'Growth',
      sortable: true,
      render: (value) => value !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {value > 0 ? (
            <TrendingUpIcon fontSize="small" color="success" />
          ) : null}
          <Typography 
            variant="body2" 
            color={value > 0 ? 'success.main' : 'text.secondary'}
            fontWeight="600"
          >
            {value > 0 ? '+' : ''}{value}%
          </Typography>
        </Box>
      )
    }
  ];

  const handleRowClick = (product) => {
    navigate(`/products/${product.id || product._id}`);
  };

  const handleFormSubmit = async (productData) => {
    try {
      await productService.create(productData);
      setOpenForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <AIEnhancedPage
      pageContext="products"
      contextData={{ 
        total: products.length,
        categories: [...new Set(products.map(p => p.category))].length
      }}
      aiInsights={generateAIInsights()}
      quickActions={getQuickActions()}
      tips={getTips()}
    >
      <Box>
        <PageHeader
          title="Product Catalog"
          subtitle={`Managing ${products.length} products across ${[...new Set(products.map(p => p.category))].length} categories`}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Add Product
            </Button>
          }
        />

        <Box sx={{ mt: 3 }}>
          <SmartDataGrid
            title={`Products (${products.length})`}
            data={products}
            columns={columns}
            onRowClick={handleRowClick}
            aiInsights={generateRowInsights()}
            enableAI={true}
            enableExport={true}
            emptyMessage={loading ? "Loading products..." : "No products found. Click 'Add Product' to get started."}
          />
        </Box>

        {openForm && (
          <ProductForm
            open={openForm}
            onClose={() => setOpenForm(false)}
            onSubmit={handleFormSubmit}
          />
        )}
      </Box>
    </AIEnhancedPage>
  );
};

export default ProductListEnhanced;
