import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { rowToDocument } from '../services/d1.js';

const hierarchy = new Hono();
hierarchy.use('*', authMiddleware);

const generateId = () => crypto.randomUUID();
const getCompanyId = (c) => {
  const id = c.get('companyId') || c.get('tenantId') || c.req.header('X-Company-Code');
  if (!id) throw new Error('TENANT_REQUIRED');
  return id;
};

hierarchy.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const [regions, districts, stores] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM regions WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as count FROM districts WHERE company_id = ?').bind(companyId).first(),
      db.prepare('SELECT COUNT(*) as count FROM stores WHERE company_id = ?').bind(companyId).first(),
    ]);
    return c.json({
      success: true,
      data: {
        regions: regions?.count || 0,
        districts: districts?.count || 0,
        stores: stores?.count || 0,
        levels: ['Region', 'District', 'Store']
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.get('/regions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const dbRegions = await db.prepare('SELECT * FROM regions WHERE company_id = ? ORDER BY name ASC').bind(companyId).all();
    const regionList = (dbRegions.results || []).map(rowToDocument);
    if (regionList.length > 0) {
      const districts = await db.prepare('SELECT * FROM districts WHERE company_id = ? ORDER BY name ASC').bind(companyId).all();
      const districtsByRegion = {};
      (districts.results || []).forEach(d => {
        const rid = d.region_id || 'unknown';
        if (!districtsByRegion[rid]) districtsByRegion[rid] = [];
        districtsByRegion[rid].push(d.name);
      });
      regionList.forEach(r => { r.cities = districtsByRegion[r.id] || []; });
      return c.json({ success: true, data: regionList });
    }
    const customers = await db.prepare('SELECT DISTINCT region, city FROM customers WHERE company_id = ? AND region IS NOT NULL ORDER BY region').bind(companyId).all();
    const regionMap = {};
    (customers.results || []).forEach(r => {
      const region = r.region || 'Unknown';
      if (!regionMap[region]) regionMap[region] = { id: `region-${region.toLowerCase().replace(/\s+/g, '-')}`, name: region, cities: [] };
      if (r.city && !regionMap[region].cities.includes(r.city)) regionMap[region].cities.push(r.city);
    });
    return c.json({ success: true, data: Object.values(regionMap) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.get('/districts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { regionId } = c.req.query();
    const dbDistricts = await db.prepare('SELECT * FROM districts WHERE company_id = ? ORDER BY name ASC').bind(companyId).all();
    if ((dbDistricts.results || []).length > 0) {
      let districts = (dbDistricts.results || []).map(rowToDocument);
      if (regionId) districts = districts.filter(d => d.regionId === regionId);
      return c.json({ success: true, data: districts });
    }
    let query = 'SELECT DISTINCT city, region FROM customers WHERE company_id = ? AND city IS NOT NULL';
    const params = [companyId];
    if (regionId) { query += ' AND region = ?'; params.push(regionId); }
    query += ' ORDER BY city';
    const customers = await db.prepare(query).bind(...params).all();
    const districts = (customers.results || []).map(r => ({
      id: `district-${(r.city || '').toLowerCase().replace(/\s+/g, '-')}`,
      name: r.city, region: r.region, regionName: r.region
    }));
    return c.json({ success: true, data: districts });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.get('/stores', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { region, city } = c.req.query();
    let query = 'SELECT * FROM customers WHERE company_id = ?';
    const params = [companyId];
    if (region) { query += ' AND region = ?'; params.push(region); }
    if (city) { query += ' AND city = ?'; params.push(city); }
    query += ' ORDER BY name ASC';
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ success: true, data: (result.results || []).map(rowToDocument) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.post('/regions', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    if (!body.name) return c.json({ success: false, message: 'name is required' }, 400);
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare('INSERT INTO regions (id, company_id, name, code, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(
      id, companyId, body.name, body.code || body.name.toLowerCase().replace(/\s+/g, '-'), body.status || 'active', JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM regions WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: { ...rowToDocument(created), cities: [] } }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.post('/districts', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    if (!body.name) return c.json({ success: false, message: 'name is required' }, 400);
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare('INSERT INTO districts (id, company_id, name, region_id, region_name, code, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(
      id, companyId, body.name, body.regionId || body.region_id || null, body.regionName || body.region || null,
      body.code || body.name.toLowerCase().replace(/\s+/g, '-'), body.status || 'active', JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM districts WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.post('/stores', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const body = await c.req.json();
    if (!body.name) return c.json({ success: false, message: 'name is required' }, 400);
    const id = generateId();
    const now = new Date().toISOString();
    await db.prepare('INSERT INTO customers (id, company_id, name, code, customer_type, channel, tier, status, region, city, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(
      id, companyId, body.name, body.code || null, body.customerType || body.customer_type || 'store',
      body.channel || null, body.tier || null, body.status || 'active', body.region || null, body.city || null,
      JSON.stringify(body.data || {}), now, now
    ).run();
    const created = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: rowToDocument(created) }, 201);
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.put('/regions/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare('UPDATE regions SET name = COALESCE(?, name), code = COALESCE(?, code), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?').bind(
      body.name || null, body.code || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM regions WHERE id = ?').bind(id).first();
    if (!updated) return c.json({ success: false, message: 'Region not found' }, 404);
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.put('/districts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare('UPDATE districts SET name = COALESCE(?, name), region_id = COALESCE(?, region_id), region_name = COALESCE(?, region_name), code = COALESCE(?, code), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?').bind(
      body.name || null, body.regionId || body.region_id || null, body.regionName || body.region || null,
      body.code || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM districts WHERE id = ?').bind(id).first();
    if (!updated) return c.json({ success: false, message: 'District not found' }, 404);
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.put('/stores/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    const body = await c.req.json();
    const now = new Date().toISOString();
    await db.prepare('UPDATE customers SET name = COALESCE(?, name), region = COALESCE(?, region), city = COALESCE(?, city), status = COALESCE(?, status), updated_at = ? WHERE id = ? AND company_id = ?').bind(
      body.name || null, body.region || null, body.city || null, body.status || null, now, id, companyId
    ).run();
    const updated = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
    if (!updated) return c.json({ success: false, message: 'Store not found' }, 404);
    return c.json({ success: true, data: rowToDocument(updated) });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.delete('/regions/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM regions WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    await db.prepare('DELETE FROM districts WHERE region_id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Region deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.delete('/districts/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM districts WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'District deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

hierarchy.delete('/stores/:id', async (c) => {
  try {
    const db = c.env.DB;
    const companyId = getCompanyId(c);
    const { id } = c.req.param();
    await db.prepare('DELETE FROM customers WHERE id = ? AND company_id = ?').bind(id, companyId).run();
    return c.json({ success: true, message: 'Store deleted' });
  } catch (error) {
    if (error.message === 'TENANT_REQUIRED') return c.json({ success: false, message: 'Company context required' }, 401);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export const hierarchyRoutes = hierarchy;
