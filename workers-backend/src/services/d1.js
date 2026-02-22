// Cloudflare D1 Database client for Workers
// Replaces MongoDB Atlas Data API with native Cloudflare D1 (SQLite)

// Table name mapping (collection name -> table name)
const TABLE_MAP = {
  users: 'users',
  companies: 'companies',
  customers: 'customers',
  products: 'products',
  promotions: 'promotions',
  budgets: 'budgets',
  tradespends: 'trade_spends',
  trade_spends: 'trade_spends',
  activities: 'activities',
  notifications: 'notifications',
  reportruns: 'report_runs',
  report_runs: 'report_runs',
  vendors: 'vendors',
  campaigns: 'campaigns',
  trading_terms: 'trading_terms',
  tradingterms: 'trading_terms',
  rebates: 'rebates',
  claims: 'claims',
  deductions: 'deductions',
  approvals: 'approvals',
  data_lineage: 'data_lineage',
  forecasts: 'forecasts',
  kam_wallets: 'kam_wallets',
  import_jobs: 'import_jobs',
  simulations: 'simulations',
  business_rules_config: 'business_rules_config',
  allocations: 'allocations',
  activity_grid: 'activity_grid',
  settings: 'settings',
  baselines: 'baselines',
  baseline_periods: 'baseline_periods',
  volume_decomposition: 'volume_decomposition',
  accruals: 'accruals',
  accrual_periods: 'accrual_periods',
  accrual_journals: 'accrual_journals',
  settlements: 'settlements',
  settlement_lines: 'settlement_lines',
  settlement_payments: 'settlement_payments',
  pnl_reports: 'pnl_reports',
  pnl_line_items: 'pnl_line_items',
  budget_allocations: 'budget_allocations',
  budget_allocation_lines: 'budget_allocation_lines',
  trade_calendar_events: 'trade_calendar_events',
  trade_calendar_constraints: 'trade_calendar_constraints',
  demand_signals: 'demand_signals',
  demand_signal_sources: 'demand_signal_sources',
  scenarios: 'scenarios',
  scenario_variables: 'scenario_variables',
  scenario_results: 'scenario_results',
  promotion_optimizations: 'promotion_optimizations',
  optimization_recommendations: 'optimization_recommendations',
  optimization_constraints: 'optimization_constraints',
  customer_360_profiles: 'customer_360_profiles',
  customer_360_insights: 'customer_360_insights',
  report_templates: 'report_templates',
  saved_reports: 'saved_reports',
  report_schedules: 'report_schedules',
  rgm_initiatives: 'rgm_initiatives',
  rgm_pricing_strategies: 'rgm_pricing_strategies',
  rgm_mix_analyses: 'rgm_mix_analyses',
  rgm_growth_trackers: 'rgm_growth_trackers',
  kpi_definitions: 'kpi_definitions',
  kpi_targets: 'kpi_targets',
  kpi_actuals: 'kpi_actuals',
  executive_scorecards: 'executive_scorecards',
  calendar_events: 'calendar_events',
  calendar_conflicts: 'calendar_conflicts',
  calendar_coverage: 'calendar_coverage'
};

// Column mapping for common fields (MongoDB field -> D1 column)
const COLUMN_MAP = {
  _id: 'id',
  companyId: 'company_id',
  customerId: 'customer_id',
  productId: 'product_id',
  promotionId: 'promotion_id',
  budgetId: 'budget_id',
  userId: 'user_id',
  createdBy: 'created_by',
  approvedBy: 'approved_by',
  rejectedBy: 'rejected_by',
  firstName: 'first_name',
  lastName: 'last_name',
  isActive: 'is_active',
  loginAttempts: 'login_attempts',
  lockUntil: 'lock_until',
  lastLogin: 'last_login',
  refreshToken: 'refresh_token',
  refreshTokenExpiry: 'refresh_token_expiry',
  passwordChangedAt: 'password_changed_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  startDate: 'start_date',
  endDate: 'end_date',
  sellInStartDate: 'sell_in_start_date',
  sellInEndDate: 'sell_in_end_date',
  promotionType: 'promotion_type',
  spendType: 'spend_type',
  activityType: 'activity_type',
  spendId: 'spend_id',
  approvedAt: 'approved_at',
  rejectedAt: 'rejected_at',
  rejectionReason: 'rejection_reason',
  budgetType: 'budget_type',
  customerType: 'customer_type',
  unitPrice: 'unit_price',
  costPrice: 'cost_price',
  sapCustomerId: 'sap_customer_id',
  entityType: 'entity_type',
  entityId: 'entity_id',
  entityName: 'entity_name',
  requestedBy: 'requested_by',
  requestedAt: 'requested_at',
  assignedTo: 'assigned_to',
  dueDate: 'due_date',
  slaHours: 'sla_hours',
  escalatedTo: 'escalated_to',
  escalatedAt: 'escalated_at',
  rebateType: 'rebate_type',
  tradingTermId: 'trading_term_id',
  rateType: 'rate_type',
  accruedAmount: 'accrued_amount',
  settledAmount: 'settled_amount',
  calculationBasis: 'calculation_basis',
  settlementFrequency: 'settlement_frequency',
  lastCalculatedAt: 'last_calculated_at',
  claimNumber: 'claim_number',
  claimType: 'claim_type',
  rebateId: 'rebate_id',
  claimedAmount: 'claimed_amount',
  approvedAmount: 'approved_amount',
  claimDate: 'claim_date',
  settlementDate: 'settlement_date',
  supportingDocuments: 'supporting_documents',
  reviewedBy: 'reviewed_by',
  reviewedAt: 'reviewed_at',
  reviewNotes: 'review_notes',
  deductionNumber: 'deduction_number',
  deductionType: 'deduction_type',
  invoiceNumber: 'invoice_number',
  invoiceDate: 'invoice_date',
  deductionAmount: 'deduction_amount',
  matchedAmount: 'matched_amount',
  remainingAmount: 'remaining_amount',
  deductionDate: 'deduction_date',
  reasonCode: 'reason_code',
  reasonDescription: 'reason_description',
  matchedTo: 'matched_to',
  vendorType: 'vendor_type',
  paymentTerms: 'payment_terms',
  taxNumber: 'tax_number',
  bankDetails: 'bank_details',
  campaignType: 'campaign_type',
  budgetAmount: 'budget_amount',
  spentAmount: 'spent_amount',
  targetRevenue: 'target_revenue',
  actualRevenue: 'actual_revenue',
  targetVolume: 'target_volume',
  actualVolume: 'actual_volume',
  termType: 'term_type',
  paymentFrequency: 'payment_frequency',
  budgetCategory: 'budget_category',
  scopeType: 'scope_type',
  dealType: 'deal_type',
  productVendor: 'product_vendor',
  productCategory: 'product_category',
  productBrand: 'product_brand',
  productSubBrand: 'product_sub_brand',
  customerChannel: 'customer_channel',
  customerSubChannel: 'customer_sub_channel',
  customerSegmentation: 'customer_segmentation',
  customerHierarchy1: 'customer_hierarchy_1',
  customerHierarchy2: 'customer_hierarchy_2',
  customerHierarchy3: 'customer_hierarchy_3',
  customerHeadOffice: 'customer_head_office',
  subChannel: 'sub_channel',
  headOffice: 'head_office',
  subBrand: 'sub_brand',
  forecastType: 'forecast_type',
  periodType: 'period_type',
  startPeriod: 'start_period',
  endPeriod: 'end_period',
  baseYear: 'base_year',
  forecastYear: 'forecast_year',
  totalForecast: 'total_forecast',
  totalActual: 'total_actual',
  variancePercent: 'variance_percent',
  confidenceLevel: 'confidence_level',
  simulationType: 'simulation_type',
  allocationType: 'allocation_type',
  updatedBy: 'updated_by',
  contactName: 'contact_name',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
  customerName: 'customer_name',
  productName: 'product_name',
  activityName: 'activity_name',
  budgetAllocated: 'budget_allocated',
  budgetSpent: 'budget_spent',
  claimId: 'claim_id',
  baselineType: 'baseline_type',
  calculationMethod: 'calculation_method',
  periodsUsed: 'periods_used',
  seasonalityEnabled: 'seasonality_enabled',
  trendEnabled: 'trend_enabled',
  outlierRemovalEnabled: 'outlier_removal_enabled',
  outlierThreshold: 'outlier_threshold',
  totalBaseVolume: 'total_base_volume',
  totalBaseRevenue: 'total_base_revenue',
  avgWeeklyVolume: 'avg_weekly_volume',
  avgWeeklyRevenue: 'avg_weekly_revenue',
  seasonalityIndex: 'seasonality_index',
  trendCoefficient: 'trend_coefficient',
  rSquared: 'r_squared',
  baselineId: 'baseline_id',
  periodStart: 'period_start',
  periodEnd: 'period_end',
  periodNumber: 'period_number',
  periodLabel: 'period_label',
  baseVolume: 'base_volume',
  baseRevenue: 'base_revenue',
  baseUnits: 'base_units',
  seasonalityFactor: 'seasonality_factor',
  trendAdjustment: 'trend_adjustment',
  varianceVolume: 'variance_volume',
  varianceRevenue: 'variance_revenue',
  variancePct: 'variance_pct',
  isPromoted: 'is_promoted',
  incrementalVolume: 'incremental_volume',
  incrementalRevenue: 'incremental_revenue',
  totalVolume: 'total_volume',
  cannibalizationVolume: 'cannibalization_volume',
  pantryLoadingVolume: 'pantry_loading_volume',
  haloVolume: 'halo_volume',
  pullForwardVolume: 'pull_forward_volume',
  postPromoDipVolume: 'post_promo_dip_volume',
  totalRevenue: 'total_revenue',
  tradeSpend: 'trade_spend',
  incrementalProfit: 'incremental_profit',
  liftPct: 'lift_pct',
  efficiencyScore: 'efficiency_score',
  accrualType: 'accrual_type',
  accrualId: 'accrual_id',
  glAccount: 'gl_account',
  costCenter: 'cost_center',
  baseAmount: 'base_amount',
  postedAmount: 'posted_amount',
  reversedAmount: 'reversed_amount',
  lastPostedAt: 'last_posted_at',
  autoCalculate: 'auto_calculate',
  autoPost: 'auto_post',
  baseSales: 'base_sales',
  accrualRate: 'accrual_rate',
  calculatedAmount: 'calculated_amount',
  adjustedAmount: 'adjusted_amount',
  varianceAmount: 'variance_amount',
  postedAt: 'posted_at',
  postedBy: 'posted_by',
  glJournalRef: 'gl_journal_ref',
  accrualPeriodId: 'accrual_period_id',
  journalType: 'journal_type',
  journalDate: 'journal_date',
  debitAccount: 'debit_account',
  creditAccount: 'credit_account',
  reversedBy: 'reversed_by',
  reversedAt: 'reversed_at',
  reversalJournalId: 'reversal_journal_id',
  narration: 'narration',
  settlementNumber: 'settlement_number',
  settlementType: 'settlement_type',
  paymentMethod: 'payment_method',
  paymentReference: 'payment_reference',
  paymentDate: 'payment_date',
  processedBy: 'processed_by',
  processedAt: 'processed_at',
  lineNumber: 'line_number',
  adjustmentAmount: 'adjustment_amount',
  adjustmentReason: 'adjustment_reason',
  paymentType: 'payment_type',
  bankReference: 'bank_reference',
  erpReference: 'erp_reference',
  deductionId: 'deduction_id',
  settlementId: 'settlement_id',
  reportType: 'report_type',
  grossSales: 'gross_sales',
  netSales: 'net_sales',
  cogs: 'cogs',
  grossProfit: 'gross_profit',
  grossMarginPct: 'gross_margin_pct',
  netTradeCost: 'net_trade_cost',
  netProfit: 'net_profit',
  netMarginPct: 'net_margin_pct',
  budgetVariance: 'budget_variance',
  budgetVariancePct: 'budget_variance_pct',
  generatedAt: 'generated_at',
  generatedBy: 'generated_by',
  reportId: 'report_id',
  lineType: 'line_type',
  lineLabel: 'line_label',
  sortOrder: 'sort_order',
  allocationMethod: 'allocation_method',
  sourceAmount: 'source_amount',
  allocatedAmount: 'allocated_amount',
  utilizedAmount: 'utilized_amount',
  utilizationPct: 'utilization_pct',
  fiscalYear: 'fiscal_year',
  lockedBy: 'locked_by',
  lockedAt: 'locked_at',
  allocationId: 'allocation_id',
  dimensionType: 'dimension_type',
  dimensionId: 'dimension_id',
  dimensionName: 'dimension_name',
  parentLineId: 'parent_line_id',
  allocatedPct: 'allocated_pct',
  committedAmount: 'committed_amount',
  priorYearAmount: 'prior_year_amount',
  priorYearGrowthPct: 'prior_year_growth_pct',
  forecastAmount: 'forecast_amount',
  eventType: 'event_type',
  allDay: 'all_day',
  plannedSpend: 'planned_spend',
  actualSpend: 'actual_spend',
  plannedVolume: 'planned_volume',
  plannedRevenue: 'planned_revenue',
  constraintType: 'constraint_type',
  dayOfWeek: 'day_of_week',
  maxConcurrentPromotions: 'max_concurrent_promotions',
  maxSpendAmount: 'max_spend_amount',
  minGapDays: 'min_gap_days',
  maxDiscountPct: 'max_discount_pct',
  minLeadTimeDays: 'min_lead_time_days',
  requireApproval: 'require_approval',
  violationAction: 'violation_action',
  signalType: 'signal_type',
  signalDate: 'signal_date',
  sourceType: 'source_type',
  unitsSold: 'units_sold',
  avgPrice: 'avg_price',
  baselineUnits: 'baseline_units',
  baselineRevenue: 'baseline_revenue',
  incrementalUnits: 'incremental_units',
  promoFlag: 'promo_flag',
  inventoryLevel: 'inventory_level',
  outOfStockFlag: 'out_of_stock_flag',
  distributionPct: 'distribution_pct',
  priceIndex: 'price_index',
  competitorPrice: 'competitor_price',
  marketSharePct: 'market_share_pct',
  weatherCondition: 'weather_condition',
  sentimentScore: 'sentiment_score',
  trendDirection: 'trend_direction',
  anomalyFlag: 'anomaly_flag',
  anomalyType: 'anomaly_type',
  lastSyncAt: 'last_sync_at',
  nextSyncAt: 'next_sync_at',
  recordCount: 'record_count',
  scenarioType: 'scenario_type',
  basePromotionId: 'base_promotion_id',
  basePromotionName: 'base_promotion_name',
  baseBudgetId: 'base_budget_id',
  baseBudgetName: 'base_budget_name',
  baselineMarginPct: 'baseline_margin_pct',
  projectedRevenue: 'projected_revenue',
  projectedUnits: 'projected_units',
  projectedSpend: 'projected_spend',
  projectedRoi: 'projected_roi',
  projectedLiftPct: 'projected_lift_pct',
  projectedMarginPct: 'projected_margin_pct',
  projectedIncrementalRevenue: 'projected_incremental_revenue',
  projectedIncrementalUnits: 'projected_incremental_units',
  projectedNetProfit: 'projected_net_profit',
  confidenceScore: 'confidence_score',
  riskLevel: 'risk_level',
  comparisonScenarioId: 'comparison_scenario_id',
  isFavorite: 'is_favorite',
  variableName: 'variable_name',
  variableType: 'variable_type',
  baseValue: 'base_value',
  adjustedValue: 'adjusted_value',
  changePct: 'change_pct',
  minValue: 'min_value',
  maxValue: 'max_value',
  stepSize: 'step_size',
  impactOnRevenue: 'impact_on_revenue',
  impactOnUnits: 'impact_on_units',
  impactOnRoi: 'impact_on_roi',
  resultType: 'result_type',
  metricName: 'metric_name',
  metricValue: 'metric_value',
  baselineValue: 'baseline_value',
  confidenceLow: 'confidence_low',
  confidenceHigh: 'confidence_high',
  confidencePct: 'confidence_pct',
  optimizationType: 'optimization_type',
  budgetLimit: 'budget_limit',
  minRoiThreshold: 'min_roi_threshold',
  minLiftThreshold: 'min_lift_threshold',
  optimizedSpend: 'optimized_spend',
  optimizedRevenue: 'optimized_revenue',
  optimizedRoi: 'optimized_roi',
  optimizedLiftPct: 'optimized_lift_pct',
  optimizedMarginPct: 'optimized_margin_pct',
  optimizedIncrementalRevenue: 'optimized_incremental_revenue',
  optimizedNetProfit: 'optimized_net_profit',
  improvementPct: 'improvement_pct',
  modelVersion: 'model_version',
  runCount: 'run_count',
  lastRunAt: 'last_run_at',
  recommendationType: 'recommendation_type',
  recommendedValue: 'recommended_value',
  expectedImpactRevenue: 'expected_impact_revenue',
  expectedImpactRoi: 'expected_impact_roi',
  expectedImpactUnits: 'expected_impact_units',
  expectedImpactMargin: 'expected_impact_margin',
  actionTaken: 'action_taken',
  appliedAt: 'applied_at',
  constraintName: 'constraint_name',
  thresholdValue: 'threshold_value',
  currentValue: 'current_value',
  isViolated: 'is_violated',
  customerName: 'customer_name',
  customerCode: 'customer_code',
  subChannel: 'sub_channel',
  totalRevenue: 'total_revenue',
  totalSpend: 'total_spend',
  totalClaims: 'total_claims',
  totalDeductions: 'total_deductions',
  netRevenue: 'net_revenue',
  grossMarginPct: 'gross_margin_pct',
  tradeSpendPct: 'trade_spend_pct',
  revenueGrowthPct: 'revenue_growth_pct',
  avgOrderValue: 'avg_order_value',
  orderFrequency: 'order_frequency',
  lastOrderDate: 'last_order_date',
  activePromotions: 'active_promotions',
  completedPromotions: 'completed_promotions',
  activeClaims: 'active_claims',
  pendingDeductions: 'pending_deductions',
  ltvScore: 'ltv_score',
  churnRisk: 'churn_risk',
  churnReason: 'churn_reason',
  priceSensitivity: 'price_sensitivity',
  promoResponsiveness: 'promo_responsiveness',
  nextBestAction: 'next_best_action',
  healthScore: 'health_score',
  satisfactionScore: 'satisfaction_score',
  engagementScore: 'engagement_score',
  paymentReliability: 'payment_reliability',
  topProducts: 'top_products',
  topCategories: 'top_categories',
  monthlyRevenue: 'monthly_revenue',
  monthlySpend: 'monthly_spend',
  insightType: 'insight_type',
  metricName: 'metric_name',
  metricValue: 'metric_value',
  metricUnit: 'metric_unit',
  benchmarkValue: 'benchmark_value',
  variancePct: 'variance_pct',
  trendDirection: 'trend_direction',
  actionDate: 'action_date',
  actionBy: 'action_by',
  validFrom: 'valid_from',
  validUntil: 'valid_until',
  reportCategory: 'report_category',
  reportType: 'report_type',
  dataSource: 'data_source',
  chartConfig: 'chart_config',
  scheduleEnabled: 'schedule_enabled',
  scheduleFrequency: 'schedule_frequency',
  scheduleDay: 'schedule_day',
  scheduleTime: 'schedule_time',
  scheduleRecipients: 'schedule_recipients',
  lastRunAt: 'last_run_at',
  runCount: 'run_count',
  templateId: 'template_id',
  filtersApplied: 'filters_applied',
  parametersApplied: 'parameters_applied',
  rowCount: 'row_count',
  reportData: 'report_data',
  summaryData: 'summary_data',
  chartData: 'chart_data',
  exportFormat: 'export_format',
  exportUrl: 'export_url',
  fileSize: 'file_size',
  generationTimeMs: 'generation_time_ms',
  isFavorite: 'is_favorite',
  isShared: 'is_shared',
  sharedWith: 'shared_with',
  expiresAt: 'expires_at',
  generatedBy: 'generated_by',
  dayOfWeek: 'day_of_week',
  dayOfMonth: 'day_of_month',
  timeOfDay: 'time_of_day',
  nextRunAt: 'next_run_at',
  lastStatus: 'last_status',
  lastError: 'last_error',
  initiativeType: 'initiative_type',
  targetRevenue: 'target_revenue',
  targetMarginPct: 'target_margin_pct',
  targetGrowthPct: 'target_growth_pct',
  actualRevenue: 'actual_revenue',
  actualMarginPct: 'actual_margin_pct',
  actualGrowthPct: 'actual_growth_pct',
  baselineRevenue: 'baseline_revenue',
  baselineMarginPct: 'baseline_margin_pct',
  investmentAmount: 'investment_amount',
  confidenceScore: 'confidence_score',
  riskLevel: 'risk_level',
  strategyType: 'strategy_type',
  currentPrice: 'current_price',
  recommendedPrice: 'recommended_price',
  priceChangePct: 'price_change_pct',
  currentMarginPct: 'current_margin_pct',
  projectedMarginPct: 'projected_margin_pct',
  priceElasticity: 'price_elasticity',
  volumeImpactPct: 'volume_impact_pct',
  revenueImpact: 'revenue_impact',
  marginImpact: 'margin_impact',
  competitorPrice: 'competitor_price',
  priceIndex: 'price_index',
  effectiveDate: 'effective_date',
  analysisType: 'analysis_type',
  totalVolume: 'total_volume',
  totalMargin: 'total_margin',
  avgMarginPct: 'avg_margin_pct',
  mixScore: 'mix_score',
  opportunityValue: 'opportunity_value',
  metricType: 'metric_type',
  dimensionId: 'dimension_id',
  dimensionName: 'dimension_name',
  targetValue: 'target_value',
  actualValue: 'actual_value',
  priorValue: 'prior_value',
  variancePct: 'variance_pct',
  growthPct: 'growth_pct',
  contributionPct: 'contribution_pct',
  trendDirection: 'trend_direction',
  kpiType: 'kpi_type',
  calculationMethod: 'calculation_method',
  dataSource: 'data_source',
  sourceTable: 'source_table',
  sourceColumn: 'source_column',
  thresholdRed: 'threshold_red',
  thresholdAmber: 'threshold_amber',
  thresholdGreen: 'threshold_green',
  sortOrder: 'sort_order',
  isActive: 'is_active',
  kpiId: 'kpi_id',
  kpiName: 'kpi_name',
  periodStart: 'period_start',
  periodEnd: 'period_end',
  targetValue: 'target_value',
  stretchTarget: 'stretch_target',
  floorValue: 'floor_value',
  priorYearValue: 'prior_year_value',
  budgetValue: 'budget_value',
  actualValue: 'actual_value',
  achievementPct: 'achievement_pct',
  priorPeriodValue: 'prior_period_value',
  yoyGrowthPct: 'yoy_growth_pct',
  momGrowthPct: 'mom_growth_pct',
  ytdActual: 'ytd_actual',
  ytdTarget: 'ytd_target',
  ytdAchievementPct: 'ytd_achievement_pct',
  ragStatus: 'rag_status',
  scorecardType: 'scorecard_type',
  overallScore: 'overall_score',
  overallRag: 'overall_rag',
  financialScore: 'financial_score',
  operationalScore: 'operational_score',
  customerScore: 'customer_score',
  growthScore: 'growth_score',
  totalKpis: 'total_kpis',
  greenCount: 'green_count',
  amberCount: 'amber_count',
  redCount: 'red_count',
  publishedAt: 'published_at',
  publishedBy: 'published_by',
  promotionId: 'promotion_id',
  promotionName: 'promotion_name',
  eventType: 'event_type',
  durationDays: 'duration_days',
  expectedLift: 'expected_lift',
  actualLift: 'actual_lift',
  isRecurring: 'is_recurring',
  recurrencePattern: 'recurrence_pattern',
  overlapCount: 'overlap_count',
  eventAId: 'event_a_id',
  eventATitle: 'event_a_title',
  eventBId: 'event_b_id',
  eventBTitle: 'event_b_title',
  conflictType: 'conflict_type',
  overlapStart: 'overlap_start',
  overlapEnd: 'overlap_end',
  overlapDays: 'overlap_days',
  sharedCustomer: 'shared_customer',
  sharedProduct: 'shared_product',
  sharedChannel: 'shared_channel',
  impactDescription: 'impact_description',
  resolvedBy: 'resolved_by',
  resolvedAt: 'resolved_at',
  analysisPeriod: 'analysis_period',
  coveredDays: 'covered_days',
  coveragePct: 'coverage_pct',
  gapDays: 'gap_days',
  avgDailySpend: 'avg_daily_spend',
  peakDay: 'peak_day',
  peakCount: 'peak_count'
};

// Reverse column mapping (D1 column -> MongoDB field)
const REVERSE_COLUMN_MAP = Object.fromEntries(
  Object.entries(COLUMN_MAP).map(([k, v]) => [v, k])
);

// Fields that should be stored in the JSON 'data' column
const JSON_FIELDS = [
  'mechanics', 'financial', 'period', 'products', 'customers', 'approvals',
  'performance', 'metrics', 'settings', 'permissions', 'hierarchy',
  'contacts', 'address', 'allocations', 'details', 'lineItems',
  // Additional fields that don't have dedicated columns
  'email', 'phone', 'company', 'notes', 'description', 'tags', 'metadata',
  'notes'
];

// Known columns per table (to avoid inserting unknown columns)
const TABLE_COLUMNS = {
  customers: ['id', 'company_id', 'name', 'code', 'sap_customer_id', 'customer_type', 'channel', 'tier', 'status', 'region', 'city', 'data', 'created_at', 'updated_at', 'sub_channel', 'segmentation', 'hierarchy_1', 'hierarchy_2', 'hierarchy_3', 'head_office'],
  products: ['id', 'company_id', 'name', 'code', 'sku', 'barcode', 'category', 'subcategory', 'brand', 'unit_price', 'cost_price', 'status', 'data', 'created_at', 'updated_at', 'vendor', 'sub_brand'],
  budgets: ['id', 'company_id', 'name', 'year', 'amount', 'utilized', 'budget_type', 'status', 'created_by', 'data', 'created_at', 'updated_at', 'budget_category', 'scope_type', 'deal_type', 'claim_type', 'product_vendor', 'product_category', 'product_brand', 'product_sub_brand', 'product_id', 'customer_channel', 'customer_sub_channel', 'customer_segmentation', 'customer_hierarchy_1', 'customer_hierarchy_2', 'customer_hierarchy_3', 'customer_head_office', 'customer_id'],
  promotions: ['id', 'company_id', 'name', 'description', 'promotion_type', 'status', 'start_date', 'end_date', 'sell_in_start_date', 'sell_in_end_date', 'budget_id', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'data', 'created_at', 'updated_at'],
  trade_spends: ['id', 'company_id', 'spend_id', 'budget_id', 'promotion_id', 'customer_id', 'product_id', 'amount', 'spend_type', 'activity_type', 'status', 'description', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'data', 'created_at', 'updated_at'],
  users: ['id', 'company_id', 'email', 'password', 'first_name', 'last_name', 'role', 'department', 'permissions', 'is_active', 'login_attempts', 'lock_until', 'last_login', 'refresh_token', 'refresh_token_expiry', 'password_changed_at', 'data', 'created_at', 'updated_at'],
  companies: ['id', 'name', 'code', 'type', 'country', 'currency', 'timezone', 'status', 'subscription_plan', 'settings', 'data', 'created_at', 'updated_at'],
  vendors: ['id', 'company_id', 'name', 'code', 'vendor_type', 'status', 'contact_name', 'contact_email', 'contact_phone', 'address', 'city', 'region', 'country', 'payment_terms', 'tax_number', 'bank_details', 'data', 'created_at', 'updated_at'],
  campaigns: ['id', 'company_id', 'name', 'description', 'campaign_type', 'status', 'start_date', 'end_date', 'budget_amount', 'spent_amount', 'target_revenue', 'actual_revenue', 'target_volume', 'actual_volume', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  trading_terms: ['id', 'company_id', 'name', 'description', 'term_type', 'status', 'customer_id', 'start_date', 'end_date', 'rate', 'rate_type', 'threshold', 'cap', 'payment_frequency', 'calculation_basis', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  rebates: ['id', 'company_id', 'name', 'description', 'rebate_type', 'status', 'customer_id', 'trading_term_id', 'start_date', 'end_date', 'rate', 'rate_type', 'threshold', 'cap', 'accrued_amount', 'settled_amount', 'calculation_basis', 'settlement_frequency', 'last_calculated_at', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  claims: ['id', 'company_id', 'claim_number', 'claim_type', 'status', 'customer_id', 'promotion_id', 'rebate_id', 'claimed_amount', 'approved_amount', 'settled_amount', 'claim_date', 'due_date', 'settlement_date', 'reason', 'supporting_documents', 'reviewed_by', 'reviewed_at', 'review_notes', 'created_by', 'data', 'created_at', 'updated_at'],
  deductions: ['id', 'company_id', 'deduction_number', 'deduction_type', 'status', 'customer_id', 'invoice_number', 'invoice_date', 'deduction_amount', 'matched_amount', 'remaining_amount', 'deduction_date', 'due_date', 'reason_code', 'reason_description', 'matched_to', 'reviewed_by', 'reviewed_at', 'review_notes', 'created_by', 'data', 'created_at', 'updated_at'],
  approvals: ['id', 'company_id', 'entity_type', 'entity_id', 'entity_name', 'amount', 'status', 'priority', 'requested_by', 'requested_at', 'assigned_to', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'comments', 'due_date', 'sla_hours', 'escalated_to', 'escalated_at', 'data', 'created_at', 'updated_at'],
  activities: ['id', 'company_id', 'user_id', 'action', 'entity_type', 'entity_id', 'description', 'data', 'created_at'],
  notifications: ['id', 'company_id', 'user_id', 'title', 'message', 'type', 'read', 'data', 'created_at'],
  business_rules_config: ['id', 'company_id', 'category', 'rules', 'updated_by', 'data', 'created_at', 'updated_at'],
  allocations: ['id', 'company_id', 'name', 'budget_id', 'customer_id', 'product_id', 'amount', 'status', 'allocation_type', 'created_by', 'data', 'created_at', 'updated_at'],
  settings: ['id', 'company_id', 'key', 'value', 'data', 'created_at', 'updated_at'],
  simulations: ['id', 'company_id', 'name', 'description', 'simulation_type', 'status', 'config', 'results', 'scenarios', 'constraints', 'created_by', 'applied_to', 'parameters', 'data', 'created_at', 'updated_at'],
  forecasts: ['id', 'company_id', 'name', 'forecast_type', 'status', 'period_type', 'start_period', 'end_period', 'base_year', 'forecast_year', 'total_forecast', 'total_actual', 'variance', 'variance_percent', 'method', 'confidence_level', 'created_by', 'data', 'created_at', 'updated_at'],
  activity_grid: ['id', 'company_id', 'activity_name', 'activity_type', 'status', 'start_date', 'end_date', 'customer_id', 'product_id', 'vendor_id', 'budget_allocated', 'budget_spent', 'performance', 'notes', 'source_type', 'source_id', 'created_by', 'created_at', 'updated_at'],
  data_lineage: ['id', 'company_id', 'entity_type', 'entity_id', 'field_name', 'old_value', 'new_value', 'change_type', 'source', 'source_details', 'changed_by', 'changed_at', 'data'],
  report_runs: ['id', 'company_id', 'report_type', 'status', 'date_range', 'filters', 'data', 'created_by', 'completed_at', 'created_at', 'updated_at'],
  saved_views: ['id', 'company_id', 'user_id', 'name', 'entity_type', 'filters', 'columns', 'sort_by', 'sort_order', 'is_default', 'created_at', 'updated_at'],
  data_quality_issues: ['id', 'company_id', 'entity_type', 'entity_id', 'field_name', 'issue_type', 'severity', 'message', 'resolved', 'resolved_at', 'resolved_by', 'created_at'],
  kam_wallets: ['id', 'company_id', 'user_id', 'year', 'quarter', 'month', 'allocated_amount', 'utilized_amount', 'committed_amount', 'available_amount', 'status', 'data', 'created_at', 'updated_at'],
  import_jobs: ['id', 'company_id', 'import_type', 'status', 'file_name', 'file_url', 'total_rows', 'processed_rows', 'success_rows', 'error_rows', 'errors', 'mapping', 'options', 'started_at', 'completed_at', 'created_by', 'created_at', 'updated_at'],
  transactions: ['id', 'company_id', 'transaction_number', 'transaction_type', 'status', 'customer_id', 'product_id', 'amount', 'description', 'reference', 'payment_reference', 'created_by', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason', 'settled_at', 'data', 'created_at', 'updated_at'],
  alerts: ['id', 'company_id', 'alert_type', 'severity', 'status', 'title', 'message', 'entity_type', 'entity_id', 'acknowledged_by', 'acknowledged_at', 'dismissed_at', 'data', 'created_at', 'updated_at'],
  customer_assignments: ['id', 'company_id', 'customer_id', 'user_id', 'role', 'status', 'data', 'created_at', 'updated_at'],
  announcements: ['id', 'company_id', 'title', 'content', 'category', 'priority', 'status', 'target_audience', 'published_at', 'created_by', 'data', 'created_at', 'updated_at'],
  policies: ['id', 'company_id', 'title', 'content', 'category', 'version', 'status', 'effective_date', 'published_at', 'created_by', 'data', 'created_at', 'updated_at'],
  courses: ['id', 'company_id', 'title', 'description', 'category', 'difficulty', 'duration_minutes', 'status', 'content_url', 'created_by', 'data', 'created_at', 'updated_at'],
  games: ['id', 'company_id', 'title', 'description', 'game_type', 'difficulty', 'points', 'status', 'created_by', 'data', 'created_at', 'updated_at'],
  regions: ['id', 'company_id', 'name', 'code', 'status', 'data', 'created_at', 'updated_at'],
  districts: ['id', 'company_id', 'name', 'region_id', 'region_name', 'code', 'status', 'data', 'created_at', 'updated_at'],
  baselines: ['id', 'company_id', 'name', 'description', 'status', 'baseline_type', 'calculation_method', 'granularity', 'customer_id', 'product_id', 'category', 'brand', 'channel', 'region', 'start_date', 'end_date', 'base_year', 'periods_used', 'seasonality_enabled', 'trend_enabled', 'outlier_removal_enabled', 'outlier_threshold', 'confidence_level', 'total_base_volume', 'total_base_revenue', 'avg_weekly_volume', 'avg_weekly_revenue', 'seasonality_index', 'trend_coefficient', 'r_squared', 'mape', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  baseline_periods: ['id', 'company_id', 'baseline_id', 'period_start', 'period_end', 'period_number', 'period_label', 'base_volume', 'base_revenue', 'base_units', 'seasonality_factor', 'trend_adjustment', 'actual_volume', 'actual_revenue', 'variance_volume', 'variance_revenue', 'variance_pct', 'is_promoted', 'promotion_id', 'incremental_volume', 'incremental_revenue', 'data', 'created_at', 'updated_at'],
  volume_decomposition: ['id', 'company_id', 'baseline_id', 'promotion_id', 'customer_id', 'product_id', 'period_start', 'period_end', 'total_volume', 'base_volume', 'incremental_volume', 'cannibalization_volume', 'pantry_loading_volume', 'halo_volume', 'pull_forward_volume', 'post_promo_dip_volume', 'total_revenue', 'base_revenue', 'incremental_revenue', 'trade_spend', 'incremental_profit', 'roi', 'lift_pct', 'efficiency_score', 'data', 'created_at', 'updated_at'],
  accruals: ['id', 'company_id', 'name', 'description', 'status', 'accrual_type', 'calculation_method', 'frequency', 'customer_id', 'product_id', 'promotion_id', 'budget_id', 'trading_term_id', 'baseline_id', 'gl_account', 'cost_center', 'start_date', 'end_date', 'rate', 'rate_type', 'base_amount', 'accrued_amount', 'posted_amount', 'reversed_amount', 'settled_amount', 'remaining_amount', 'currency', 'last_calculated_at', 'last_posted_at', 'auto_calculate', 'auto_post', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  accrual_periods: ['id', 'company_id', 'accrual_id', 'period_start', 'period_end', 'period_number', 'period_label', 'base_sales', 'accrual_rate', 'calculated_amount', 'adjusted_amount', 'posted_amount', 'variance_amount', 'variance_pct', 'status', 'posted_at', 'posted_by', 'gl_journal_ref', 'data', 'created_at', 'updated_at'],
  accrual_journals: ['id', 'company_id', 'accrual_id', 'accrual_period_id', 'journal_type', 'journal_date', 'debit_account', 'credit_account', 'amount', 'currency', 'reference', 'narration', 'status', 'posted_by', 'reversed_by', 'reversed_at', 'reversal_journal_id', 'data', 'created_at', 'updated_at'],
  settlements: ['id', 'company_id', 'settlement_number', 'name', 'description', 'status', 'settlement_type', 'customer_id', 'promotion_id', 'accrual_id', 'claim_id', 'deduction_id', 'budget_id', 'gl_account', 'cost_center', 'settlement_date', 'due_date', 'accrued_amount', 'claimed_amount', 'approved_amount', 'settled_amount', 'variance_amount', 'variance_pct', 'payment_method', 'payment_reference', 'payment_date', 'currency', 'notes', 'created_by', 'approved_by', 'approved_at', 'processed_by', 'processed_at', 'data', 'created_at', 'updated_at'],
  settlement_lines: ['id', 'company_id', 'settlement_id', 'line_number', 'product_id', 'product_name', 'category', 'description', 'quantity', 'unit_price', 'accrued_amount', 'claimed_amount', 'approved_amount', 'adjustment_amount', 'adjustment_reason', 'settled_amount', 'status', 'data', 'created_at', 'updated_at'],
  settlement_payments: ['id', 'company_id', 'settlement_id', 'payment_type', 'payment_date', 'amount', 'currency', 'reference', 'bank_reference', 'erp_reference', 'status', 'notes', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  pnl_reports: ['id', 'company_id', 'name', 'description', 'status', 'report_type', 'period_type', 'start_date', 'end_date', 'customer_id', 'promotion_id', 'product_id', 'category', 'channel', 'region', 'gross_sales', 'trade_spend', 'net_sales', 'cogs', 'gross_profit', 'gross_margin_pct', 'accruals', 'settlements', 'claims', 'deductions', 'net_trade_cost', 'net_profit', 'net_margin_pct', 'budget_amount', 'budget_variance', 'budget_variance_pct', 'roi', 'currency', 'generated_at', 'generated_by', 'data', 'created_at', 'updated_at'],
  pnl_line_items: ['id', 'company_id', 'report_id', 'line_type', 'line_label', 'sort_order', 'customer_id', 'customer_name', 'promotion_id', 'promotion_name', 'product_id', 'product_name', 'period_start', 'period_end', 'gross_sales', 'trade_spend', 'net_sales', 'cogs', 'gross_profit', 'gross_margin_pct', 'accruals', 'settlements', 'claims', 'deductions', 'net_trade_cost', 'net_profit', 'net_margin_pct', 'budget_amount', 'budget_variance', 'roi', 'data', 'created_at', 'updated_at'],
  budget_allocations: ['id', 'company_id', 'name', 'description', 'status', 'allocation_method', 'budget_id', 'source_amount', 'allocated_amount', 'remaining_amount', 'utilized_amount', 'utilization_pct', 'fiscal_year', 'period_type', 'start_date', 'end_date', 'dimension', 'currency', 'locked', 'locked_by', 'locked_at', 'approved_by', 'approved_at', 'notes', 'created_by', 'data', 'created_at', 'updated_at'],
  budget_allocation_lines: ['id', 'company_id', 'allocation_id', 'line_number', 'dimension_type', 'dimension_id', 'dimension_name', 'parent_line_id', 'level', 'source_amount', 'allocated_amount', 'allocated_pct', 'utilized_amount', 'committed_amount', 'remaining_amount', 'utilization_pct', 'prior_year_amount', 'prior_year_growth_pct', 'forecast_amount', 'variance_amount', 'variance_pct', 'status', 'notes', 'data', 'created_at', 'updated_at'],
  trade_calendar_events: ['id', 'company_id', 'name', 'description', 'event_type', 'status', 'start_date', 'end_date', 'all_day', 'recurrence', 'color', 'customer_id', 'customer_name', 'product_id', 'product_name', 'promotion_id', 'budget_id', 'channel', 'region', 'category', 'brand', 'planned_spend', 'actual_spend', 'planned_volume', 'actual_volume', 'planned_revenue', 'actual_revenue', 'roi', 'lift_pct', 'priority', 'tags', 'notes', 'created_by', 'approved_by', 'approved_at', 'data', 'created_at', 'updated_at'],
  trade_calendar_constraints: ['id', 'company_id', 'name', 'description', 'constraint_type', 'status', 'scope', 'start_date', 'end_date', 'day_of_week', 'customer_id', 'customer_name', 'product_id', 'product_name', 'channel', 'region', 'category', 'brand', 'max_concurrent_promotions', 'max_spend_amount', 'min_gap_days', 'max_discount_pct', 'min_lead_time_days', 'require_approval', 'priority', 'violation_action', 'notes', 'created_by', 'data', 'created_at', 'updated_at'],
  demand_signals: ['id', 'company_id', 'source_id', 'source_name', 'signal_type', 'signal_date', 'period_start', 'period_end', 'granularity', 'customer_id', 'customer_name', 'product_id', 'product_name', 'category', 'brand', 'channel', 'region', 'store_id', 'store_name', 'units_sold', 'revenue', 'volume', 'avg_price', 'baseline_units', 'baseline_revenue', 'incremental_units', 'incremental_revenue', 'lift_pct', 'promo_flag', 'promotion_id', 'inventory_level', 'out_of_stock_flag', 'distribution_pct', 'price_index', 'competitor_price', 'market_share_pct', 'weather_condition', 'temperature', 'sentiment_score', 'trend_direction', 'confidence', 'anomaly_flag', 'anomaly_type', 'notes', 'data', 'created_at', 'updated_at'],
  demand_signal_sources: ['id', 'company_id', 'name', 'description', 'source_type', 'provider', 'frequency', 'status', 'last_sync_at', 'next_sync_at', 'record_count', 'config', 'credentials', 'created_by', 'data', 'created_at', 'updated_at'],
  scenarios: ['id', 'company_id', 'name', 'description', 'scenario_type', 'status', 'base_promotion_id', 'base_promotion_name', 'base_budget_id', 'base_budget_name', 'customer_id', 'customer_name', 'product_id', 'product_name', 'category', 'brand', 'channel', 'region', 'start_date', 'end_date', 'baseline_revenue', 'baseline_units', 'baseline_margin_pct', 'projected_revenue', 'projected_units', 'projected_spend', 'projected_roi', 'projected_lift_pct', 'projected_margin_pct', 'projected_incremental_revenue', 'projected_incremental_units', 'projected_net_profit', 'confidence_score', 'risk_level', 'recommendation', 'comparison_scenario_id', 'is_favorite', 'tags', 'notes', 'created_by', 'data', 'created_at', 'updated_at'],
  scenario_variables: ['id', 'company_id', 'scenario_id', 'variable_name', 'variable_type', 'category', 'base_value', 'adjusted_value', 'change_pct', 'min_value', 'max_value', 'step_size', 'unit', 'impact_on_revenue', 'impact_on_units', 'impact_on_roi', 'sensitivity', 'sort_order', 'notes', 'data', 'created_at', 'updated_at'],
  scenario_results: ['id', 'company_id', 'scenario_id', 'result_type', 'period', 'metric_name', 'metric_value', 'baseline_value', 'variance', 'variance_pct', 'confidence_low', 'confidence_high', 'confidence_pct', 'sort_order', 'data', 'created_at', 'updated_at'],
  promotion_optimizations: ['id', 'company_id', 'name', 'description', 'optimization_type', 'status', 'objective', 'customer_id', 'customer_name', 'product_id', 'product_name', 'category', 'brand', 'channel', 'region', 'start_date', 'end_date', 'budget_limit', 'min_roi_threshold', 'min_lift_threshold', 'max_discount_pct', 'baseline_revenue', 'baseline_units', 'baseline_margin_pct', 'optimized_spend', 'optimized_revenue', 'optimized_roi', 'optimized_lift_pct', 'optimized_margin_pct', 'optimized_incremental_revenue', 'optimized_net_profit', 'improvement_pct', 'confidence_score', 'model_version', 'run_count', 'last_run_at', 'created_by', 'notes', 'data', 'created_at', 'updated_at'],
  optimization_recommendations: ['id', 'company_id', 'optimization_id', 'recommendation_type', 'priority', 'title', 'description', 'current_value', 'recommended_value', 'change_pct', 'expected_impact_revenue', 'expected_impact_roi', 'expected_impact_units', 'expected_impact_margin', 'confidence', 'risk_level', 'category', 'metric_name', 'rationale', 'action_taken', 'applied_at', 'sort_order', 'data', 'created_at', 'updated_at'],
  optimization_constraints: ['id', 'company_id', 'optimization_id', 'constraint_name', 'constraint_type', 'operator', 'threshold_value', 'current_value', 'is_violated', 'severity', 'sort_order', 'notes', 'data', 'created_at', 'updated_at'],
  customer_360_profiles: ['id', 'company_id', 'customer_id', 'customer_name', 'customer_code', 'channel', 'sub_channel', 'tier', 'region', 'status', 'total_revenue', 'total_spend', 'total_claims', 'total_deductions', 'net_revenue', 'gross_margin_pct', 'trade_spend_pct', 'revenue_growth_pct', 'avg_order_value', 'order_frequency', 'last_order_date', 'active_promotions', 'completed_promotions', 'active_claims', 'pending_deductions', 'ltv_score', 'churn_risk', 'churn_reason', 'segment', 'price_sensitivity', 'promo_responsiveness', 'next_best_action', 'health_score', 'satisfaction_score', 'engagement_score', 'payment_reliability', 'top_products', 'top_categories', 'monthly_revenue', 'monthly_spend', 'last_calculated_at', 'notes', 'data', 'created_at', 'updated_at'],
  customer_360_insights: ['id', 'company_id', 'customer_id', 'insight_type', 'category', 'severity', 'title', 'description', 'metric_name', 'metric_value', 'metric_unit', 'benchmark_value', 'variance_pct', 'trend_direction', 'recommendation', 'action_taken', 'action_date', 'action_by', 'valid_from', 'valid_until', 'confidence', 'source', 'data', 'created_at', 'updated_at'],
  report_templates: ['id', 'company_id', 'name', 'description', 'report_category', 'report_type', 'data_source', 'columns', 'filters', 'grouping', 'sorting', 'calculations', 'chart_config', 'parameters', 'is_system', 'is_shared', 'shared_with', 'schedule_enabled', 'schedule_frequency', 'schedule_day', 'schedule_time', 'schedule_recipients', 'last_run_at', 'run_count', 'created_by', 'tags', 'version', 'status', 'notes', 'data', 'created_at', 'updated_at'],
  saved_reports: ['id', 'company_id', 'template_id', 'name', 'description', 'report_category', 'report_type', 'data_source', 'status', 'filters_applied', 'parameters_applied', 'columns', 'row_count', 'report_data', 'summary_data', 'chart_data', 'export_format', 'export_url', 'file_size', 'generation_time_ms', 'is_favorite', 'is_shared', 'shared_with', 'expires_at', 'generated_by', 'tags', 'notes', 'data', 'created_at', 'updated_at'],
  report_schedules: ['id', 'company_id', 'template_id', 'name', 'description', 'frequency', 'day_of_week', 'day_of_month', 'time_of_day', 'timezone', 'recipients', 'format', 'filters', 'parameters', 'is_active', 'last_run_at', 'next_run_at', 'run_count', 'last_status', 'last_error', 'created_by', 'notes', 'data', 'created_at', 'updated_at'],
  rgm_initiatives: ['id', 'company_id', 'name', 'description', 'initiative_type', 'status', 'priority', 'category', 'customer_id', 'customer_name', 'product_id', 'product_name', 'channel', 'region', 'brand', 'start_date', 'end_date', 'target_revenue', 'target_margin_pct', 'target_growth_pct', 'actual_revenue', 'actual_margin_pct', 'actual_growth_pct', 'baseline_revenue', 'baseline_margin_pct', 'investment_amount', 'roi', 'confidence_score', 'risk_level', 'owner', 'approved_by', 'approved_at', 'created_by', 'tags', 'notes', 'data', 'created_at', 'updated_at'],
  rgm_pricing_strategies: ['id', 'company_id', 'initiative_id', 'name', 'description', 'strategy_type', 'status', 'product_id', 'product_name', 'category', 'brand', 'customer_id', 'customer_name', 'channel', 'current_price', 'recommended_price', 'price_change_pct', 'current_margin_pct', 'projected_margin_pct', 'price_elasticity', 'volume_impact_pct', 'revenue_impact', 'margin_impact', 'competitor_price', 'price_index', 'effective_date', 'end_date', 'approved_by', 'approved_at', 'created_by', 'notes', 'data', 'created_at', 'updated_at'],
  rgm_mix_analyses: ['id', 'company_id', 'initiative_id', 'name', 'description', 'analysis_type', 'status', 'dimension', 'period_start', 'period_end', 'total_revenue', 'total_volume', 'total_margin', 'avg_margin_pct', 'mix_score', 'opportunity_value', 'items', 'recommendations', 'created_by', 'notes', 'data', 'created_at', 'updated_at'],
  rgm_growth_trackers: ['id', 'company_id', 'initiative_id', 'period', 'period_start', 'period_end', 'metric_type', 'dimension', 'dimension_id', 'dimension_name', 'target_value', 'actual_value', 'prior_value', 'variance', 'variance_pct', 'growth_pct', 'contribution_pct', 'trend_direction', 'notes', 'data', 'created_at', 'updated_at'],
  kpi_definitions: ['id', 'company_id', 'name', 'description', 'kpi_type', 'category', 'unit', 'format', 'calculation_method', 'data_source', 'source_table', 'source_column', 'aggregation', 'frequency', 'direction', 'threshold_red', 'threshold_amber', 'threshold_green', 'weight', 'sort_order', 'is_active', 'owner', 'tags', 'notes', 'data', 'created_by', 'created_at', 'updated_at'],
  kpi_targets: ['id', 'company_id', 'kpi_id', 'kpi_name', 'period', 'period_start', 'period_end', 'target_value', 'stretch_target', 'floor_value', 'prior_year_value', 'budget_value', 'status', 'approved_by', 'approved_at', 'notes', 'data', 'created_by', 'created_at', 'updated_at'],
  kpi_actuals: ['id', 'company_id', 'kpi_id', 'kpi_name', 'period', 'period_start', 'period_end', 'actual_value', 'target_value', 'variance', 'variance_pct', 'achievement_pct', 'trend_direction', 'prior_period_value', 'prior_year_value', 'yoy_growth_pct', 'mom_growth_pct', 'ytd_actual', 'ytd_target', 'ytd_achievement_pct', 'rag_status', 'notes', 'data', 'created_by', 'created_at', 'updated_at'],
  executive_scorecards: ['id', 'company_id', 'name', 'description', 'scorecard_type', 'status', 'period', 'period_start', 'period_end', 'overall_score', 'overall_rag', 'financial_score', 'operational_score', 'customer_score', 'growth_score', 'total_kpis', 'green_count', 'amber_count', 'red_count', 'highlights', 'lowlights', 'actions', 'commentary', 'published_at', 'published_by', 'notes', 'data', 'created_by', 'created_at', 'updated_at'],
  calendar_events: ['id', 'company_id', 'promotion_id', 'promotion_name', 'event_type', 'title', 'description', 'start_date', 'end_date', 'duration_days', 'customer_id', 'customer_name', 'product_id', 'product_name', 'category', 'brand', 'channel', 'region', 'mechanic', 'status', 'budget', 'expected_lift', 'actual_lift', 'priority', 'color', 'is_recurring', 'recurrence_pattern', 'overlap_count', 'tags', 'notes', 'data', 'created_by', 'created_at', 'updated_at'],
  calendar_conflicts: ['id', 'company_id', 'event_a_id', 'event_a_title', 'event_b_id', 'event_b_title', 'conflict_type', 'severity', 'overlap_start', 'overlap_end', 'overlap_days', 'shared_customer', 'shared_product', 'shared_channel', 'impact_description', 'resolution', 'resolved_by', 'resolved_at', 'status', 'notes', 'data', 'created_at', 'updated_at'],
  calendar_coverage: ['id', 'company_id', 'analysis_period', 'period_start', 'period_end', 'dimension', 'dimension_id', 'dimension_name', 'total_days', 'covered_days', 'coverage_pct', 'gap_days', 'overlap_days', 'event_count', 'total_budget', 'avg_daily_spend', 'peak_day', 'peak_count', 'gaps', 'recommendations', 'notes', 'data', 'created_at', 'updated_at']
};

// Generate a UUID for new records
function generateId() {
  return crypto.randomUUID();
}

// Convert MongoDB-style filter to SQL WHERE clause
function filterToWhere(filter, params = []) {
  const conditions = [];
  
  for (const [key, value] of Object.entries(filter)) {
    // Skip MongoDB-specific operators at top level
    if (key === '$or' || key === '$and') continue;
    
    // Handle ObjectId format
    if (key === '_id') {
      if (typeof value === 'object' && value.$oid) {
        params.push(value.$oid);
      } else {
        params.push(value);
      }
      conditions.push('id = ?');
      continue;
    }
    
    const column = COLUMN_MAP[key] || key;
    
    if (typeof value === 'object' && value !== null) {
      // Handle MongoDB operators
      if (value.$oid) {
        params.push(value.$oid);
        conditions.push(`${column} = ?`);
      } else if (value.$in) {
        const placeholders = value.$in.map(() => '?').join(', ');
        params.push(...value.$in);
        conditions.push(`${column} IN (${placeholders})`);
      } else if (value.$regex) {
        params.push(`%${value.$regex}%`);
        conditions.push(`${column} LIKE ?`);
      } else if (value.$gt) {
        params.push(value.$gt);
        conditions.push(`${column} > ?`);
      } else if (value.$gte) {
        params.push(value.$gte);
        conditions.push(`${column} >= ?`);
      } else if (value.$lt) {
        params.push(value.$lt);
        conditions.push(`${column} < ?`);
      } else if (value.$lte) {
        params.push(value.$lte);
        conditions.push(`${column} <= ?`);
      } else if (value.$ne) {
        params.push(value.$ne);
        conditions.push(`${column} != ?`);
      }
    } else if (value === null) {
      conditions.push(`${column} IS NULL`);
    } else {
      params.push(value);
      conditions.push(`${column} = ?`);
    }
  }
  
  // Handle $or operator
  if (filter.$or && Array.isArray(filter.$or)) {
    const orConditions = filter.$or.map(subFilter => {
      const subParams = [];
      const subWhere = filterToWhere(subFilter, subParams);
      params.push(...subParams);
      return `(${subWhere})`;
    });
    if (orConditions.length > 0) {
      conditions.push(`(${orConditions.join(' OR ')})`);
    }
  }
  
  return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
}

// Convert MongoDB-style sort to SQL ORDER BY
function sortToOrderBy(sort) {
  if (!sort || Object.keys(sort).length === 0) {
    return 'created_at DESC';
  }
  
  return Object.entries(sort)
    .map(([key, direction]) => {
      const column = COLUMN_MAP[key] || key;
      return `${column} ${direction === -1 ? 'DESC' : 'ASC'}`;
    })
    .join(', ');
}

// Convert D1 row to MongoDB-style document
function rowToDocument(row) {
  if (!row) return null;
  
  const doc = {};
  
  for (const [column, value] of Object.entries(row)) {
    // Convert column name back to camelCase
    const field = REVERSE_COLUMN_MAP[column] || column;
    
    if (column === 'id') {
      doc._id = value;
      doc.id = value;
    } else if (column === 'data' && value) {
      // Merge JSON data into document
      try {
        const jsonData = JSON.parse(value);
        Object.assign(doc, jsonData);
      } catch (e) {
        doc.data = value;
      }
    } else if (column === 'permissions' && value) {
      try {
        doc.permissions = JSON.parse(value);
      } catch (e) {
        doc.permissions = [];
      }
    } else if (column === 'is_active') {
      doc.isActive = value === 1;
    } else {
      doc[field] = value;
    }
  }
  
  return doc;
}

// Convert document to D1 row format
// tableName parameter is used to filter out columns that don't exist in the table
function documentToRow(document, tableName = null, isUpdate = false) {
  const row = {};
  const jsonData = {};
  
  // Get valid columns for this table (if known)
  const validColumns = tableName ? TABLE_COLUMNS[tableName] : null;
  
  for (const [field, value] of Object.entries(document)) {
    if (field === '_id' || field === 'id' || field === 'createdAt' || field === 'updatedAt') continue;
    
    const column = COLUMN_MAP[field] || field;
    
    const isValidColumn = validColumns && validColumns.includes(column);
    
    if (isValidColumn) {
      if (typeof value === 'boolean') {
        row[column] = value ? 1 : 0;
      } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        jsonData[field] = value;
      } else {
        row[column] = value;
      }
    } else if (JSON_FIELDS.includes(field)) {
      jsonData[field] = value;
    } else if (validColumns && !isValidColumn) {
      jsonData[field] = value;
    } else {
      if (typeof value === 'boolean') {
        row[column] = value ? 1 : 0;
      } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        jsonData[field] = value;
      } else {
        row[column] = value;
      }
    }
  }
  
  // Add JSON data if any
  if (Object.keys(jsonData).length > 0) {
    row.data = JSON.stringify(jsonData);
  }
  
  return row;
}

export class D1Client {
  constructor(env) {
    this.db = env.DB;
  }

  getTableName(collection) {
    return TABLE_MAP[collection] || collection;
  }

  // Find one document
  async findOne(collection, filter, projection = {}) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
    const result = await this.db.prepare(sql).bind(...params).first();
    
    return rowToDocument(result);
  }

  // Find multiple documents
  async find(collection, filter = {}, options = {}) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    const orderBy = sortToOrderBy(options.sort);
    const limit = options.limit || 100;
    const offset = options.skip || 0;
    
    const sql = `SELECT * FROM ${table} WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await this.db.prepare(sql).bind(...params).all();
    
    return (result.results || []).map(rowToDocument);
  }

  // Insert one document
  async insertOne(collection, document) {
    const table = this.getTableName(collection);
    const id = generateId();
    const now = new Date().toISOString();
    
    // Pass table name to documentToRow to filter out unknown columns
    const row = documentToRow(document, table);
    row.id = id;
    row.created_at = now;
    row.updated_at = now;
    
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(row);
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.db.prepare(sql).bind(...values).run();
    
    return id;
  }

  // Insert multiple documents
  async insertMany(collection, documents) {
    const ids = [];
    
    for (const doc of documents) {
      const id = await this.insertOne(collection, doc);
      ids.push(id);
    }
    
    return ids;
  }

  // Update one document
  async updateOne(collection, filter, update) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    // Get existing document to merge JSON data
    const existing = await this.findOne(collection, filter);
    
    // Pass table name to documentToRow to filter out unknown columns
    const row = documentToRow(update, table, true);
    row.updated_at = new Date().toISOString();
    
    // Merge JSON data if both exist
    if (existing && existing.data && row.data) {
      try {
        const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : existing.data;
        const newData = JSON.parse(row.data);
        row.data = JSON.stringify({ ...existingData, ...newData });
      } catch (e) {
        // Keep new data as is
      }
    }
    
    const setClauses = Object.keys(row).map(col => `${col} = ?`).join(', ');
    const setValues = Object.values(row);
    
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...setValues, ...params).run();
    
    return { modifiedCount: result.changes || 0 };
  }

  // Update multiple documents
  async updateMany(collection, filter, update) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    // Pass table name to documentToRow to filter out unknown columns
    const row = documentToRow(update, table, true);
    row.updated_at = new Date().toISOString();
    
    const setClauses = Object.keys(row).map(col => `${col} = ?`).join(', ');
    const setValues = Object.values(row);
    
    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...setValues, ...params).run();
    
    return { modifiedCount: result.changes || 0 };
  }

  // Delete one document
  async deleteOne(collection, filter) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const existing = await this.db.prepare(`SELECT id FROM ${table} WHERE ${where} LIMIT 1`).bind(...params).first();
    if (!existing) return { deletedCount: 0 };
    const result = await this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(existing.id).run();
    
    return { deletedCount: result.changes || 0 };
  }

  // Delete multiple documents
  async deleteMany(collection, filter) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...params).run();
    
    return { deletedCount: result.changes || 0 };
  }

  // Count documents
  async countDocuments(collection, filter = {}) {
    const table = this.getTableName(collection);
    const params = [];
    const where = filterToWhere(filter, params);
    
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`;
    const result = await this.db.prepare(sql).bind(...params).first();
    
    return result?.count || 0;
  }

  // Aggregate (simplified - supports basic grouping)
  async aggregate(collection, pipeline) {
    const table = this.getTableName(collection);
    
    // For now, handle simple aggregations
    // Complex aggregations would need to be rewritten as SQL
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        const where = filterToWhere(stage.$match, params);
        sql = `SELECT * FROM ${table} WHERE ${where}`;
      }
      if (stage.$count) {
        sql = `SELECT COUNT(*) as ${stage.$count} FROM ${table}`;
        if (params.length > 0) {
          sql = `SELECT COUNT(*) as ${stage.$count} FROM ${table} WHERE ${filterToWhere(pipeline[0].$match || {}, [])}`;
        }
      }
      if (stage.$group) {
        const group = stage.$group;
        const groupId = group._id;
        const selectParts = [];
        const groupByParts = [];

        if (groupId === null) {
          selectParts.push("'all' as _id");
        } else if (typeof groupId === 'string' && groupId.startsWith('$')) {
          const field = groupId.substring(1);
          const col = COLUMN_MAP[field] || field;
          selectParts.push(`${col} as _id`);
          groupByParts.push(col);
        } else if (typeof groupId === 'object' && groupId !== null) {
          const idParts = [];
          for (const [alias, expr] of Object.entries(groupId)) {
            if (typeof expr === 'string' && expr.startsWith('$')) {
              const col = COLUMN_MAP[expr.substring(1)] || expr.substring(1);
              idParts.push(`${col} as ${alias}`);
              groupByParts.push(col);
            }
          }
          if (idParts.length > 0) {
            selectParts.push(...idParts);
          } else {
            selectParts.push("'all' as _id");
          }
        }

        for (const [alias, expr] of Object.entries(group)) {
          if (alias === '_id') continue;
          if (typeof expr === 'object' && expr !== null) {
            if (expr.$sum !== undefined) {
              if (typeof expr.$sum === 'string' && expr.$sum.startsWith('$')) {
                const col = COLUMN_MAP[expr.$sum.substring(1)] || expr.$sum.substring(1);
                selectParts.push(`COALESCE(SUM(${col}), 0) as ${alias}`);
              } else if (expr.$sum === 1) {
                selectParts.push(`COUNT(*) as ${alias}`);
              } else {
                selectParts.push(`${expr.$sum} as ${alias}`);
              }
            } else if (expr.$avg !== undefined && typeof expr.$avg === 'string' && expr.$avg.startsWith('$')) {
              const col = COLUMN_MAP[expr.$avg.substring(1)] || expr.$avg.substring(1);
              selectParts.push(`COALESCE(AVG(${col}), 0) as ${alias}`);
            } else if (expr.$count !== undefined) {
              selectParts.push(`COUNT(*) as ${alias}`);
            } else if (expr.$min !== undefined && typeof expr.$min === 'string' && expr.$min.startsWith('$')) {
              const col = COLUMN_MAP[expr.$min.substring(1)] || expr.$min.substring(1);
              selectParts.push(`MIN(${col}) as ${alias}`);
            } else if (expr.$max !== undefined && typeof expr.$max === 'string' && expr.$max.startsWith('$')) {
              const col = COLUMN_MAP[expr.$max.substring(1)] || expr.$max.substring(1);
              selectParts.push(`MAX(${col}) as ${alias}`);
            }
          }
        }

        if (selectParts.length === 0) {
          selectParts.push('*');
        }

        let groupSql = `SELECT ${selectParts.join(', ')} FROM ${table}`;
        if (params.length > 0 && pipeline[0]?.$match) {
          const matchParams = [];
          const matchWhere = filterToWhere(pipeline[0].$match, matchParams);
          groupSql += ` WHERE ${matchWhere}`;
          params.length = 0;
          params.push(...matchParams);
        }
        if (groupByParts.length > 0) {
          groupSql += ` GROUP BY ${groupByParts.join(', ')}`;
        }

        const groupResult = await this.db.prepare(groupSql).bind(...params).all();
        return groupResult.results || [];
      }
    }
    
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  // Execute raw SQL (for complex queries)
  async rawQuery(sql, params = []) {
    const result = await this.db.prepare(sql).bind(...params).all();
    return result.results || [];
  }

  // Execute raw SQL that modifies data
  async rawExecute(sql, params = []) {
    const result = await this.db.prepare(sql).bind(...params).run();
    return result;
  }
}

// Helper to get D1 client from context
export function getD1Client(c) {
  if (!c.get('d1')) {
    c.set('d1', new D1Client(c.env));
  }
  return c.get('d1');
}

// Export rowToDocument for routes that use raw SQL
export { rowToDocument };

// Alias for backward compatibility during migration
export { getD1Client as getMongoClient };
