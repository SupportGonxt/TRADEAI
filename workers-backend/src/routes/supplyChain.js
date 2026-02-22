import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const supplyChainRoutes = new Hono();
supplyChainRoutes.use('*', authMiddleware);

const getClient = (c) => getD1Client(c.env.DB);

supplyChainRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      supplierTypes: [
        { value: 'manufacturer', label: 'Manufacturer' },
        { value: 'distributor', label: 'Distributor' },
        { value: 'wholesaler', label: 'Wholesaler' },
        { value: 'raw_material', label: 'Raw Material' },
        { value: 'packaging', label: 'Packaging' },
        { value: 'logistics', label: 'Logistics' },
      ],
      shipmentTypes: [
        { value: 'inbound', label: 'Inbound' },
        { value: 'outbound', label: 'Outbound' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'return', label: 'Return' },
      ],
      stockStatuses: [
        { value: 'normal', label: 'Normal' },
        { value: 'low', label: 'Low Stock' },
        { value: 'critical', label: 'Critical' },
        { value: 'overstock', label: 'Overstock' },
        { value: 'stockout', label: 'Stockout' },
      ],
      alertTypes: [
        { value: 'stockout', label: 'Stockout Risk' },
        { value: 'delay', label: 'Shipment Delay' },
        { value: 'quality', label: 'Quality Issue' },
        { value: 'cost', label: 'Cost Overrun' },
        { value: 'demand', label: 'Demand Spike' },
        { value: 'supplier', label: 'Supplier Issue' },
      ],
      severities: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' },
      ],
    },
  });
});

supplyChainRoutes.get('/summary', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  try {
    const [suppliers, inventory, shipments, alerts] = await Promise.all([
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) as active, AVG(reliability_score) as avgReliability, SUM(annual_spend) as totalSpend FROM suppliers WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, SUM(total_value) as totalValue, AVG(days_of_supply) as avgDaysSupply, SUM(CASE WHEN stock_status = \'critical\' OR stock_status = \'stockout\' THEN 1 ELSE 0 END) as atRisk FROM inventory_levels WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'in_transit\' THEN 1 ELSE 0 END) as inTransit, SUM(total_cost) as totalCost, AVG(CASE WHEN on_time = 1 THEN 100.0 ELSE 0.0 END) as onTimePct FROM shipments WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'open\' THEN 1 ELSE 0 END) as openAlerts, SUM(CASE WHEN severity = \'critical\' THEN 1 ELSE 0 END) as critical FROM supply_chain_alerts WHERE company_id = ?', [companyId]),
    ]);
    return c.json({
      success: true,
      data: {
        suppliers: suppliers.results?.[0] || {},
        inventory: inventory.results?.[0] || {},
        shipments: shipments.results?.[0] || {},
        alerts: alerts.results?.[0] || {},
      },
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// --- Suppliers CRUD ---
supplyChainRoutes.get('/suppliers', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '25', offset = '0', status, search, sort = 'created_at', order = 'desc' } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (search) { where += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const colMap = { name: 'name', status: 'status', annualSpend: 'annual_spend', reliabilityScore: 'reliability_score', createdAt: 'created_at', created_at: 'created_at' };
    const orderCol = colMap[sort] || 'created_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM suppliers WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM suppliers WHERE ${where} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapSupplierRow), total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.get('/suppliers/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    const result = await db.rawQuery('SELECT * FROM suppliers WHERE id = ? AND company_id = ?', [id, companyId]);
    if (!result.results?.length) return c.json({ success: false, message: 'Not found' }, 404);
    const supplier = mapSupplierRow(result.results[0]);
    const inv = await db.rawQuery('SELECT * FROM inventory_levels WHERE company_id = ? AND supplier_id = ? ORDER BY updated_at DESC LIMIT 50', [companyId, id]);
    const ship = await db.rawQuery('SELECT * FROM shipments WHERE company_id = ? AND supplier_id = ? ORDER BY created_at DESC LIMIT 50', [companyId, id]);
    supplier.inventory = (inv.results || []).map(mapInventoryRow);
    supplier.shipments = (ship.results || []).map(mapShipmentRow);
    return c.json({ success: true, data: supplier });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.post('/suppliers', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO suppliers (id, company_id, name, description, supplier_type, status, contact_name, contact_email, contact_phone, address, city, country, lead_time_days, reliability_score, quality_score, cost_rating, annual_spend, payment_terms, certifications, categories, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.name, body.description || null, body.supplierType || 'manufacturer', body.status || 'active', body.contactName || null, body.contactEmail || null, body.contactPhone || null, body.address || null, body.city || null, body.country || null, body.leadTimeDays || 0, body.reliabilityScore || 0, body.qualityScore || 0, body.costRating || 0, body.annualSpend || 0, body.paymentTerms || 'net30', JSON.stringify(body.certifications || []), JSON.stringify(body.categories || []), body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.put('/suppliers/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { name: 'name', description: 'description', supplierType: 'supplier_type', status: 'status', contactName: 'contact_name', contactEmail: 'contact_email', contactPhone: 'contact_phone', address: 'address', city: 'city', country: 'country', leadTimeDays: 'lead_time_days', reliabilityScore: 'reliability_score', qualityScore: 'quality_score', costRating: 'cost_rating', annualSpend: 'annual_spend', paymentTerms: 'payment_terms', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.certifications) { sets.push('certifications = ?'); params.push(JSON.stringify(body.certifications)); }
    if (body.categories) { sets.push('categories = ?'); params.push(JSON.stringify(body.categories)); }
    if (body.data) { sets.push('data = ?'); params.push(JSON.stringify(body.data)); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE suppliers SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.delete('/suppliers/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM suppliers WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Inventory CRUD ---
supplyChainRoutes.get('/inventory', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '25', offset = '0', stockStatus, search, sort = 'updated_at', order = 'desc' } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (stockStatus) { where += ' AND stock_status = ?'; params.push(stockStatus); }
    if (search) { where += ' AND (product_name LIKE ? OR sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const colMap = { productName: 'product_name', currentQty: 'current_qty', totalValue: 'total_value', daysOfSupply: 'days_of_supply', stockStatus: 'stock_status', updatedAt: 'updated_at', updated_at: 'updated_at' };
    const orderCol = colMap[sort] || 'updated_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM inventory_levels WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM inventory_levels WHERE ${where} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapInventoryRow), total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.post('/inventory', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const availableQty = (body.currentQty || 0) - (body.reservedQty || 0);
    const totalValue = (body.currentQty || 0) * (body.unitCost || 0);
    await db.rawExecute(
      `INSERT INTO inventory_levels (id, company_id, product_id, product_name, warehouse_id, warehouse_name, sku, category, current_qty, reserved_qty, available_qty, reorder_point, reorder_qty, safety_stock, max_stock, unit_cost, total_value, days_of_supply, turnover_rate, stock_status, supplier_id, supplier_name, notes, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.productId || null, body.productName || null, body.warehouseId || null, body.warehouseName || null, body.sku || null, body.category || null, body.currentQty || 0, body.reservedQty || 0, availableQty, body.reorderPoint || 0, body.reorderQty || 0, body.safetyStock || 0, body.maxStock || 0, body.unitCost || 0, totalValue, body.daysOfSupply || 0, body.turnoverRate || 0, body.stockStatus || 'normal', body.supplierId || null, body.supplierName || null, body.notes || null, JSON.stringify(body.data || {}), now, now]
    );
    return c.json({ success: true, data: { id, ...body, availableQty, totalValue, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.delete('/inventory/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM inventory_levels WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Shipments CRUD ---
supplyChainRoutes.get('/shipments', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '25', offset = '0', status, shipmentType, search, sort = 'created_at', order = 'desc' } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (shipmentType) { where += ' AND shipment_type = ?'; params.push(shipmentType); }
    if (search) { where += ' AND (shipment_number LIKE ? OR tracking_number LIKE ? OR customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    const colMap = { shipmentNumber: 'shipment_number', status: 'status', shipDate: 'ship_date', totalCost: 'total_cost', createdAt: 'created_at', created_at: 'created_at' };
    const orderCol = colMap[sort] || 'created_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM shipments WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM shipments WHERE ${where} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapShipmentRow), total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.post('/shipments', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO shipments (id, company_id, shipment_number, order_id, order_number, supplier_id, supplier_name, customer_id, customer_name, shipment_type, status, origin, destination, carrier, tracking_number, ship_date, expected_delivery, actual_delivery, total_weight, total_volume, total_items, shipping_cost, insurance_cost, total_cost, on_time, damage_reported, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.shipmentNumber || null, body.orderId || null, body.orderNumber || null, body.supplierId || null, body.supplierName || null, body.customerId || null, body.customerName || null, body.shipmentType || 'outbound', body.status || 'pending', body.origin || null, body.destination || null, body.carrier || null, body.trackingNumber || null, body.shipDate || null, body.expectedDelivery || null, body.actualDelivery || null, body.totalWeight || 0, body.totalVolume || 0, body.totalItems || 0, body.shippingCost || 0, body.insuranceCost || 0, body.totalCost || 0, body.onTime !== undefined ? (body.onTime ? 1 : 0) : 1, body.damageReported ? 1 : 0, body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.delete('/shipments/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM shipments WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Supply Chain Alerts CRUD ---
supplyChainRoutes.get('/alerts', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '25', offset = '0', status, severity, alertType, sort = 'created_at', order = 'desc' } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (severity) { where += ' AND severity = ?'; params.push(severity); }
    if (alertType) { where += ' AND alert_type = ?'; params.push(alertType); }
    const colMap = { severity: 'severity', status: 'status', createdAt: 'created_at', created_at: 'created_at' };
    const orderCol = colMap[sort] || 'created_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM supply_chain_alerts WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM supply_chain_alerts WHERE ${where} ORDER BY ${orderCol} ${orderDir} LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapAlertRow), total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.post('/alerts', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO supply_chain_alerts (id, company_id, alert_type, severity, status, title, description, source_type, source_id, source_name, product_id, product_name, supplier_id, supplier_name, impact_value, impact_description, recommended_action, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.alertType || 'stockout', body.severity || 'medium', body.status || 'open', body.title, body.description || null, body.sourceType || null, body.sourceId || null, body.sourceName || null, body.productId || null, body.productName || null, body.supplierId || null, body.supplierName || null, body.impactValue || 0, body.impactDescription || null, body.recommendedAction || null, body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.put('/alerts/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { status: 'status', severity: 'severity', title: 'title', description: 'description', recommendedAction: 'recommended_action', resolvedBy: 'resolved_by', resolutionNotes: 'resolution_notes', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.status === 'resolved') { sets.push('resolved_at = ?'); params.push(now); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE supply_chain_alerts SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

supplyChainRoutes.delete('/alerts/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM supply_chain_alerts WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Row mappers
function mapSupplierRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, name: r.name, description: r.description,
    supplierType: r.supplier_type, status: r.status, contactName: r.contact_name,
    contactEmail: r.contact_email, contactPhone: r.contact_phone, address: r.address,
    city: r.city, country: r.country, leadTimeDays: r.lead_time_days,
    reliabilityScore: r.reliability_score, qualityScore: r.quality_score,
    costRating: r.cost_rating, annualSpend: r.annual_spend, paymentTerms: r.payment_terms,
    certifications: JSON.parse(r.certifications || '[]'), categories: JSON.parse(r.categories || '[]'),
    notes: r.notes, data: JSON.parse(r.data || '{}'), createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapInventoryRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, productId: r.product_id, productName: r.product_name,
    warehouseId: r.warehouse_id, warehouseName: r.warehouse_name, sku: r.sku, category: r.category,
    currentQty: r.current_qty, reservedQty: r.reserved_qty, availableQty: r.available_qty,
    reorderPoint: r.reorder_point, reorderQty: r.reorder_qty, safetyStock: r.safety_stock,
    maxStock: r.max_stock, unitCost: r.unit_cost, totalValue: r.total_value,
    daysOfSupply: r.days_of_supply, turnoverRate: r.turnover_rate, stockStatus: r.stock_status,
    lastReceivedAt: r.last_received_at, lastCountedAt: r.last_counted_at,
    supplierId: r.supplier_id, supplierName: r.supplier_name,
    notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapShipmentRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, shipmentNumber: r.shipment_number,
    orderId: r.order_id, orderNumber: r.order_number, supplierId: r.supplier_id,
    supplierName: r.supplier_name, customerId: r.customer_id, customerName: r.customer_name,
    shipmentType: r.shipment_type, status: r.status, origin: r.origin, destination: r.destination,
    carrier: r.carrier, trackingNumber: r.tracking_number, shipDate: r.ship_date,
    expectedDelivery: r.expected_delivery, actualDelivery: r.actual_delivery,
    totalWeight: r.total_weight, totalVolume: r.total_volume, totalItems: r.total_items,
    shippingCost: r.shipping_cost, insuranceCost: r.insurance_cost, totalCost: r.total_cost,
    onTime: r.on_time === 1, damageReported: r.damage_reported === 1,
    notes: r.notes, data: JSON.parse(r.data || '{}'), createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAlertRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, alertType: r.alert_type, severity: r.severity,
    status: r.status, title: r.title, description: r.description,
    sourceType: r.source_type, sourceId: r.source_id, sourceName: r.source_name,
    productId: r.product_id, productName: r.product_name,
    supplierId: r.supplier_id, supplierName: r.supplier_name,
    impactValue: r.impact_value, impactDescription: r.impact_description,
    recommendedAction: r.recommended_action, resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by, resolutionNotes: r.resolution_notes,
    notes: r.notes, data: JSON.parse(r.data || '{}'), createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export { supplyChainRoutes };
