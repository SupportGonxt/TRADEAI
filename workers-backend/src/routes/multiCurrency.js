import { Hono } from 'hono';
import { getD1Client } from '../services/d1.js';
import { authMiddleware } from '../middleware/auth.js';

const multiCurrencyRoutes = new Hono();
multiCurrencyRoutes.use('*', authMiddleware);

const getClient = (c) => getD1Client(c.env.DB);

multiCurrencyRoutes.get('/options', async (c) => {
  return c.json({
    success: true,
    data: {
      rateTypes: [
        { value: 'spot', label: 'Spot Rate' },
        { value: 'forward', label: 'Forward Rate' },
        { value: 'budget', label: 'Budget Rate' },
        { value: 'average', label: 'Average Rate' },
      ],
      marketTypes: [
        { value: 'country', label: 'Country' },
        { value: 'region', label: 'Region' },
        { value: 'zone', label: 'Trade Zone' },
        { value: 'channel', label: 'Channel' },
      ],
      roundingMethods: [
        { value: 'standard', label: 'Standard' },
        { value: 'up', label: 'Round Up' },
        { value: 'down', label: 'Round Down' },
        { value: 'banker', label: 'Banker\'s Rounding' },
      ],
      commonCurrencies: [
        { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
        { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
        { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
        { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
        { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
      ],
    },
  });
});

multiCurrencyRoutes.get('/summary', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  try {
    const [currencies, rates, markets, pricing] = await Promise.all([
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN is_base_currency = 1 THEN 1 ELSE 0 END) as baseCurrencies FROM currency_configs WHERE company_id = ? AND status = \'active\'', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, MIN(effective_date) as oldest, MAX(effective_date) as newest FROM exchange_rates WHERE company_id = ? AND status = \'active\'', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) as active FROM market_configs WHERE company_id = ?', [companyId]),
      db.rawQuery('SELECT COUNT(*) as total, AVG(local_margin_pct) as avgMargin, AVG(price_index) as avgPriceIndex FROM market_pricing WHERE company_id = ? AND status = \'active\'', [companyId]),
    ]);
    return c.json({
      success: true,
      data: {
        currencies: currencies.results?.[0] || {},
        exchangeRates: rates.results?.[0] || {},
        markets: markets.results?.[0] || {},
        pricing: pricing.results?.[0] || {},
      },
    });
  } catch (e) {
    return c.json({ success: false, message: e.message }, 500);
  }
});

// --- Currency Configs CRUD ---
multiCurrencyRoutes.get('/currencies', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', status, search } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (search) { where += ' AND (currency_code LIKE ? OR currency_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM currency_configs WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM currency_configs WHERE ${where} ORDER BY is_base_currency DESC, currency_code ASC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapCurrencyRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.post('/currencies', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO currency_configs (id, company_id, currency_code, currency_name, symbol, decimal_places, is_base_currency, status, country, region, rounding_method, display_format, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.currencyCode, body.currencyName, body.symbol || '', body.decimalPlaces || 2, body.isBaseCurrency ? 1 : 0, body.status || 'active', body.country || null, body.region || null, body.roundingMethod || 'standard', body.displayFormat || '#,##0.00', body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.put('/currencies/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { currencyCode: 'currency_code', currencyName: 'currency_name', symbol: 'symbol', decimalPlaces: 'decimal_places', status: 'status', country: 'country', region: 'region', roundingMethod: 'rounding_method', displayFormat: 'display_format', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.isBaseCurrency !== undefined) { sets.push('is_base_currency = ?'); params.push(body.isBaseCurrency ? 1 : 0); }
    if (body.data) { sets.push('data = ?'); params.push(JSON.stringify(body.data)); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE currency_configs SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.delete('/currencies/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM currency_configs WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Exchange Rates CRUD ---
multiCurrencyRoutes.get('/exchange-rates', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', fromCurrency, toCurrency, rateType } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (fromCurrency) { where += ' AND from_currency = ?'; params.push(fromCurrency); }
    if (toCurrency) { where += ' AND to_currency = ?'; params.push(toCurrency); }
    if (rateType) { where += ' AND rate_type = ?'; params.push(rateType); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM exchange_rates WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM exchange_rates WHERE ${where} ORDER BY effective_date DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapRateRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.post('/exchange-rates', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const inverseRate = body.rate ? (1 / body.rate) : 1;
    await db.rawExecute(
      `INSERT INTO exchange_rates (id, company_id, from_currency, to_currency, rate, inverse_rate, rate_type, effective_date, expiry_date, source, variance_pct, prior_rate, status, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.fromCurrency, body.toCurrency, body.rate || 1, inverseRate, body.rateType || 'spot', body.effectiveDate, body.expiryDate || null, body.source || 'manual', body.variancePct || 0, body.priorRate || 0, body.status || 'active', body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, inverseRate, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.delete('/exchange-rates/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM exchange_rates WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Market Configs CRUD ---
multiCurrencyRoutes.get('/markets', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', status, search } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (search) { where += ' AND (market_code LIKE ? OR market_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM market_configs WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM market_configs WHERE ${where} ORDER BY market_name ASC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapMarketRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.get('/markets/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    const result = await db.rawQuery('SELECT * FROM market_configs WHERE id = ? AND company_id = ?', [id, companyId]);
    if (!result.results?.length) return c.json({ success: false, message: 'Not found' }, 404);
    const market = mapMarketRow(result.results[0]);
    const pricing = await db.rawQuery('SELECT * FROM market_pricing WHERE company_id = ? AND market_id = ? ORDER BY product_name ASC LIMIT 100', [companyId, id]);
    market.pricing = (pricing.results || []).map(mapPricingRow);
    return c.json({ success: true, data: market });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.post('/markets', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.rawExecute(
      `INSERT INTO market_configs (id, company_id, market_code, market_name, description, market_type, status, country, region, timezone, base_currency, languages, tax_rate, vat_rate, regulatory_requirements, trade_policies, fiscal_year_start, date_format, number_format, population, gdp, market_size, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.marketCode, body.marketName, body.description || null, body.marketType || 'country', body.status || 'active', body.country || null, body.region || null, body.timezone || null, body.baseCurrency || 'ZAR', JSON.stringify(body.languages || []), body.taxRate || 0, body.vatRate || 0, JSON.stringify(body.regulatoryRequirements || []), JSON.stringify(body.tradePolicies || {}), body.fiscalYearStart || '01-01', body.dateFormat || 'YYYY-MM-DD', body.numberFormat || '#,##0.00', body.population || 0, body.gdp || 0, body.marketSize || 0, body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.put('/markets/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  const body = await c.req.json();
  try {
    const now = new Date().toISOString();
    const sets = [];
    const params = [];
    const fieldMap = { marketCode: 'market_code', marketName: 'market_name', description: 'description', marketType: 'market_type', status: 'status', country: 'country', region: 'region', timezone: 'timezone', baseCurrency: 'base_currency', taxRate: 'tax_rate', vatRate: 'vat_rate', fiscalYearStart: 'fiscal_year_start', dateFormat: 'date_format', numberFormat: 'number_format', population: 'population', gdp: 'gdp', marketSize: 'market_size', notes: 'notes' };
    for (const [k, col] of Object.entries(fieldMap)) {
      if (body[k] !== undefined) { sets.push(`${col} = ?`); params.push(body[k]); }
    }
    if (body.languages) { sets.push('languages = ?'); params.push(JSON.stringify(body.languages)); }
    if (body.regulatoryRequirements) { sets.push('regulatory_requirements = ?'); params.push(JSON.stringify(body.regulatoryRequirements)); }
    if (body.tradePolicies) { sets.push('trade_policies = ?'); params.push(JSON.stringify(body.tradePolicies)); }
    if (body.data) { sets.push('data = ?'); params.push(JSON.stringify(body.data)); }
    sets.push('updated_at = ?'); params.push(now);
    params.push(id, companyId);
    await db.rawExecute(`UPDATE market_configs SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, params);
    return c.json({ success: true, data: { id, ...body, updatedAt: now } });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.delete('/markets/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM market_configs WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// --- Market Pricing CRUD ---
multiCurrencyRoutes.get('/pricing', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { limit = '50', offset = '0', marketId, search } = c.req.query();
  try {
    let where = 'company_id = ?';
    const params = [companyId];
    if (marketId) { where += ' AND market_id = ?'; params.push(marketId); }
    if (search) { where += ' AND (product_name LIKE ? OR market_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const countResult = await db.rawQuery(`SELECT COUNT(*) as total FROM market_pricing WHERE ${where}`, params);
    const total = countResult.results?.[0]?.total || 0;
    const result = await db.rawQuery(`SELECT * FROM market_pricing WHERE ${where} ORDER BY market_name ASC, product_name ASC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    return c.json({ success: true, data: (result.results || []).map(mapPricingRow), total });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.post('/pricing', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const body = await c.req.json();
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const baseCurrencyPrice = (body.localPrice || 0) / (body.exchangeRate || 1);
    await db.rawExecute(
      `INSERT INTO market_pricing (id, company_id, market_id, market_name, product_id, product_name, category, brand, currency, list_price, local_price, base_currency_price, exchange_rate, tax_amount, duty_amount, landed_cost, local_margin_pct, price_index, competitor_price, effective_date, expiry_date, status, notes, data, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, body.marketId || null, body.marketName || null, body.productId || null, body.productName || null, body.category || null, body.brand || null, body.currency || 'ZAR', body.listPrice || 0, body.localPrice || 0, baseCurrencyPrice, body.exchangeRate || 1, body.taxAmount || 0, body.dutyAmount || 0, body.landedCost || 0, body.localMarginPct || 0, body.priceIndex || 100, body.competitorPrice || 0, body.effectiveDate || null, body.expiryDate || null, body.status || 'active', body.notes || null, JSON.stringify(body.data || {}), c.get('userId') || null, now, now]
    );
    return c.json({ success: true, data: { id, ...body, baseCurrencyPrice, companyId, createdAt: now, updatedAt: now } }, 201);
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

multiCurrencyRoutes.delete('/pricing/:id', async (c) => {
  const db = getClient(c);
  const companyId = c.get('companyId');
  const { id } = c.req.param();
  try {
    await db.rawExecute('DELETE FROM market_pricing WHERE id = ? AND company_id = ?', [id, companyId]);
    return c.json({ success: true, message: 'Deleted' });
  } catch (e) { return c.json({ success: false, message: e.message }, 500); }
});

// Row mappers
function mapCurrencyRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, currencyCode: r.currency_code,
    currencyName: r.currency_name, symbol: r.symbol, decimalPlaces: r.decimal_places,
    isBaseCurrency: r.is_base_currency === 1, status: r.status, country: r.country,
    region: r.region, roundingMethod: r.rounding_method, displayFormat: r.display_format,
    notes: r.notes, data: JSON.parse(r.data || '{}'), createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapRateRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, fromCurrency: r.from_currency,
    toCurrency: r.to_currency, rate: r.rate, inverseRate: r.inverse_rate,
    rateType: r.rate_type, effectiveDate: r.effective_date, expiryDate: r.expiry_date,
    source: r.source, variancePct: r.variance_pct, priorRate: r.prior_rate,
    status: r.status, notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapMarketRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, marketCode: r.market_code,
    marketName: r.market_name, description: r.description, marketType: r.market_type,
    status: r.status, country: r.country, region: r.region, timezone: r.timezone,
    baseCurrency: r.base_currency, languages: JSON.parse(r.languages || '[]'),
    taxRate: r.tax_rate, vatRate: r.vat_rate,
    regulatoryRequirements: JSON.parse(r.regulatory_requirements || '[]'),
    tradePolicies: JSON.parse(r.trade_policies || '{}'),
    fiscalYearStart: r.fiscal_year_start, dateFormat: r.date_format,
    numberFormat: r.number_format, population: r.population, gdp: r.gdp,
    marketSize: r.market_size, notes: r.notes, data: JSON.parse(r.data || '{}'),
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapPricingRow(r) {
  if (!r) return r;
  return {
    id: r.id, companyId: r.company_id, marketId: r.market_id, marketName: r.market_name,
    productId: r.product_id, productName: r.product_name, category: r.category,
    brand: r.brand, currency: r.currency, listPrice: r.list_price,
    localPrice: r.local_price, baseCurrencyPrice: r.base_currency_price,
    exchangeRate: r.exchange_rate, taxAmount: r.tax_amount, dutyAmount: r.duty_amount,
    landedCost: r.landed_cost, localMarginPct: r.local_margin_pct,
    priceIndex: r.price_index, competitorPrice: r.competitor_price,
    effectiveDate: r.effective_date, expiryDate: r.expiry_date, status: r.status,
    approvedBy: r.approved_by, approvedAt: r.approved_at, notes: r.notes,
    data: JSON.parse(r.data || '{}'), createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export { multiCurrencyRoutes };
