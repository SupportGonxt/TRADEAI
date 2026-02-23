import { Hono } from 'hono';
import { getMongoClient } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

export const productRoutes = new Hono();

productRoutes.use('*', authMiddleware);

// Get product hierarchy for selection components
productRoutes.get('/hierarchy', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    // Get all products for this tenant
    const products = await mongodb.find('products', { companyId: tenantId }, {
      sort: { name: 1 }
    });

    // Build hierarchy from product data
    // Group by category -> brand -> product
    const categoryMap = new Map();
    
    products.forEach(product => {
      const category = product.category || product.product_category || 'Other';
      const brand = product.brand || product.product_brand || 'General';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          id: `category-${category.toLowerCase().replace(/\s+/g, '-')}`,
          name: category,
          level: 1,
          volume: 0,
          children: new Map()
        });
      }
      
      const categoryNode = categoryMap.get(category);
      
      if (!categoryNode.children.has(brand)) {
        categoryNode.children.set(brand, {
          id: `brand-${category.toLowerCase().replace(/\s+/g, '-')}-${brand.toLowerCase().replace(/\s+/g, '-')}`,
          name: brand,
          level: 2,
          volume: 0,
          children: []
        });
      }
      
      const brandNode = categoryNode.children.get(brand);
      const productVolume = product.volume || product.salesVolume || 1000;
      
      brandNode.children.push({
        id: product.id || product._id,
        name: product.name,
        level: 3,
        volume: productVolume
      });
      
      brandNode.volume += productVolume;
      categoryNode.volume += productVolume;
    });

    // Convert Maps to arrays
    const hierarchy = Array.from(categoryMap.values()).map(category => ({
      ...category,
      children: Array.from(category.children.values())
    }));

    return c.json({
      success: true,
      hierarchy: hierarchy.length > 0 ? hierarchy : [
        {
          id: 'all-products',
          name: 'All Products',
          level: 1,
          volume: products.reduce((sum, p) => sum + (p.volume || p.salesVolume || 1000), 0),
          children: products.map(product => ({
            id: product.id || product._id,
            name: product.name,
            level: 2,
            volume: product.volume || product.salesVolume || 1000
          }))
        }
      ]
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get product hierarchy', error: error.message }, 500);
  }
});

// Get all products
productRoutes.get('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const { page = 1, limit = 20, search, category, brand } = c.req.query();

    const filter = { companyId: tenantId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    const products = await mongodb.find('products', filter, {
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit),
      sort: { name: 1 }
    });

    const total = await mongodb.countDocuments('products', filter);

    return c.json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get products', error: error.message }, 500);
  }
});

// Get product by ID
productRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    const product = await mongodb.findOne('products', { _id: { $oid: id }, companyId: tenantId });
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

    return c.json({ success: true, data: product });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to get product', error: error.message }, 500);
  }
});

productRoutes.get('/:id/promotions', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const product = await mongodb.findOne('products', { _id: { $oid: id }, companyId: tenantId });
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
    const promos = await mongodb.find('promotions', { companyId: tenantId }, { limit: 50, sort: { createdAt: -1 } });
    const prodId = product.id || product._id;
    const filtered = promos.filter(p =>
      (p.products || []).some(pr => (pr.product?.id || pr.product?._id || pr.id) === prodId) ||
      (p.productIds || []).includes(prodId)
    );
    return c.json({ success: true, data: filtered });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

productRoutes.get('/:id/campaigns', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const product = await mongodb.findOne('products', { _id: { $oid: id }, companyId: tenantId });
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
    return c.json({ success: true, data: product.campaigns || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

productRoutes.get('/:id/sales-history', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const product = await mongodb.findOne('products', { _id: { $oid: id }, companyId: tenantId });
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
    return c.json({ success: true, data: product.salesHistory || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

productRoutes.get('/:id/trading-terms', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);
    const product = await mongodb.findOne('products', { _id: { $oid: id }, companyId: tenantId });
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
    return c.json({ success: true, data: product.tradingTerms || [] });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Create product
productRoutes.post('/', async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const data = await c.req.json();
    const mongodb = getMongoClient(c);

    const productId = await mongodb.insertOne('products', { ...data, companyId: tenantId, status: 'active' });

    return c.json({ success: true, data: { id: productId }, message: 'Product created successfully' }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Failed to create product', error: error.message }, 500);
  }
});

// Update product
productRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const updates = await c.req.json();
    const mongodb = getMongoClient(c);

    await mongodb.updateOne('products', { _id: { $oid: id }, companyId: tenantId }, updates);

    return c.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to update product', error: error.message }, 500);
  }
});

// Delete product
productRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const tenantId = c.get('tenantId');
    const mongodb = getMongoClient(c);

    await mongodb.deleteOne('products', { _id: { $oid: id }, companyId: tenantId });

    return c.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return c.json({ success: false, message: 'Failed to delete product', error: error.message }, 500);
  }
});
