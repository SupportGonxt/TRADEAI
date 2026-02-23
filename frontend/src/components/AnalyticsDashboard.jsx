import React, { useState } from 'react';
import apiClient from '../services/api/apiClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('baseline');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  // Baseline form
  const [baselineForm, setBaselineForm] = useState({
    productId: '',
    customerId: '',
    promotionStartDate: '',
    promotionEndDate: '',
    method: 'pre_period'
  });

  // Cannibalization form
  const [cannForm, setCannForm] = useState({
    promotionId: '',
    productId: '',
    customerId: '',
    promotionStartDate: '',
    promotionEndDate: ''
  });

  // Forward buy form
  const [fbForm, setFbForm] = useState({
    promotionId: '',
    productId: '',
    customerId: '',
    promotionStartDate: '',
    promotionEndDate: '',
    postPromoPeriodWeeks: 4
  });

  const calculateBaseline = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/baseline/calculate', baselineForm);
      setResults(response.data.data);
    } catch (error) {
      console.error('Error calculating baseline:', error);
      alert('Error calculating baseline');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCannibalization = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/cannibalization/analyze-promotion', cannForm);
      setResults(response.data.data);
    } catch (error) {
      console.error('Error analyzing cannibalization:', error);
      alert('Error analyzing cannibalization');
    } finally {
      setLoading(false);
    }
  };

  const detectForwardBuy = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/forward-buy/detect', fbForm);
      setResults(response.data.data);
    } catch (error) {
      console.error('Error detecting forward buy:', error);
      alert('Error detecting forward buy');
    } finally {
      setLoading(false);
    }
  };

  const renderBaselineTab = () => (
    <div className="analysis-form">
      <h2>Baseline Calculation</h2>
      <p className="description">Calculate baseline sales and incremental lift from promotions</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Product ID</label>
          <input 
            type="text"
            value={baselineForm.productId}
            onChange={e => setBaselineForm({...baselineForm, productId: e.target.value})}
            placeholder="Enter product ID"
          />
        </div>
        
        <div className="form-group">
          <label>Customer ID</label>
          <input 
            type="text"
            value={baselineForm.customerId}
            onChange={e => setBaselineForm({...baselineForm, customerId: e.target.value})}
            placeholder="Enter customer ID"
          />
        </div>
        
        <div className="form-group">
          <label>Promotion Start Date</label>
          <input 
            type="date"
            value={baselineForm.promotionStartDate}
            onChange={e => setBaselineForm({...baselineForm, promotionStartDate: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Promotion End Date</label>
          <input 
            type="date"
            value={baselineForm.promotionEndDate}
            onChange={e => setBaselineForm({...baselineForm, promotionEndDate: e.target.value})}
          />
        </div>
        
        <div className="form-group full-width">
          <label>Baseline Method</label>
          <select 
            value={baselineForm.method}
            onChange={e => setBaselineForm({...baselineForm, method: e.target.value})}
          >
            <option value="pre_period">Pre-Period Average</option>
            <option value="control_store">Control Store</option>
            <option value="moving_average">Moving Average (4 weeks)</option>
            <option value="exponential_smoothing">Exponential Smoothing</option>
            <option value="auto">Auto-Select Best Method</option>
          </select>
        </div>
      </div>
      
      <button className="btn-primary" onClick={calculateBaseline} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Baseline'}
      </button>

      {results && results.summary && (
        <div className="results-section">
          <h3>Results</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Baseline</div>
              <div className="metric-value">{results.summary.totalBaseline.toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Actual</div>
              <div className="metric-value">{results.summary.totalActual.toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card highlight">
              <div className="metric-label">Incremental Volume</div>
              <div className="metric-value">{results.summary.totalIncremental.toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card highlight">
              <div className="metric-label">Average Lift</div>
              <div className="metric-value">{results.summary.averageLift.toFixed(1)}%</div>
              <div className="metric-unit">percent</div>
            </div>
            <div className="metric-card success">
              <div className="metric-label">Incremental Revenue</div>
              <div className="metric-value">${(results.summary.totalIncrementalRevenue || 0).toLocaleString()}</div>
              <div className="metric-unit">dollars</div>
            </div>
          </div>

          {results.baseline && results.baseline.length > 0 && (
            <div className="chart-container">
              <h4>Baseline vs. Actual Sales</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={results.baseline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="baselineQuantity" stroke="#8884d8" name="Baseline" />
                  <Line type="monotone" dataKey="actualQuantity" stroke="#82ca9d" name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCannibalizationTab = () => (
    <div className="analysis-form">
      <h2>Cannibalization Analysis</h2>
      <p className="description">Detect if the promotion cannibalized sales from related products</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Promotion ID</label>
          <input 
            type="text"
            value={cannForm.promotionId}
            onChange={e => setCannForm({...cannForm, promotionId: e.target.value})}
            placeholder="Enter promotion ID"
          />
        </div>
        
        <div className="form-group">
          <label>Product ID</label>
          <input 
            type="text"
            value={cannForm.productId}
            onChange={e => setCannForm({...cannForm, productId: e.target.value})}
            placeholder="Enter product ID"
          />
        </div>
        
        <div className="form-group">
          <label>Customer ID</label>
          <input 
            type="text"
            value={cannForm.customerId}
            onChange={e => setCannForm({...cannForm, customerId: e.target.value})}
            placeholder="Enter customer ID"
          />
        </div>
        
        <div className="form-group">
          <label>Promotion Start Date</label>
          <input 
            type="date"
            value={cannForm.promotionStartDate}
            onChange={e => setCannForm({...cannForm, promotionStartDate: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Promotion End Date</label>
          <input 
            type="date"
            value={cannForm.promotionEndDate}
            onChange={e => setCannForm({...cannForm, promotionEndDate: e.target.value})}
          />
        </div>
      </div>
      
      <button className="btn-primary" onClick={analyzeCannibalization} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Cannibalization'}
      </button>

      {results && results.netIncremental !== undefined && (
        <div className="results-section">
          <h3>Cannibalization Results</h3>
          
          <div className="severity-badge" data-severity={results.severity?.toLowerCase()}>
            {results.severity || 'NONE'} CANNIBALIZATION
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Gross Incremental</div>
              <div className="metric-value">{(results.grossIncremental || 0).toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card warning">
              <div className="metric-label">Cannibalized Volume</div>
              <div className="metric-value">{(results.totalCannibalized || 0).toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card highlight">
              <div className="metric-label">Net Incremental</div>
              <div className="metric-value">{results.netIncremental.toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Cannibalization Rate</div>
              <div className="metric-value">{(results.cannibalizationRate || 0).toFixed(1)}%</div>
              <div className="metric-unit">percent</div>
            </div>
          </div>

          {results.cannibalizedProducts && results.cannibalizedProducts.length > 0 && (
            <div className="chart-container">
              <h4>Cannibalized Products</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results.cannibalizedProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="volumeImpact" fill="#ef4444" name="Volume Lost" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {results.recommendations && (
            <div className="recommendations">
              <h4>Recommendations</h4>
              <ul>
                {(results?.recommendations || []).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderForwardBuyTab = () => (
    <div className="analysis-form">
      <h2>Forward Buy Detection</h2>
      <p className="description">Analyze post-promotion period for pantry loading effects</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Promotion ID</label>
          <input 
            type="text"
            value={fbForm.promotionId}
            onChange={e => setFbForm({...fbForm, promotionId: e.target.value})}
            placeholder="Enter promotion ID"
          />
        </div>
        
        <div className="form-group">
          <label>Product ID</label>
          <input 
            type="text"
            value={fbForm.productId}
            onChange={e => setFbForm({...fbForm, productId: e.target.value})}
            placeholder="Enter product ID"
          />
        </div>
        
        <div className="form-group">
          <label>Customer ID</label>
          <input 
            type="text"
            value={fbForm.customerId}
            onChange={e => setFbForm({...fbForm, customerId: e.target.value})}
            placeholder="Enter customer ID"
          />
        </div>
        
        <div className="form-group">
          <label>Promotion Start Date</label>
          <input 
            type="date"
            value={fbForm.promotionStartDate}
            onChange={e => setFbForm({...fbForm, promotionStartDate: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Promotion End Date</label>
          <input 
            type="date"
            value={fbForm.promotionEndDate}
            onChange={e => setFbForm({...fbForm, promotionEndDate: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Post-Promo Period (weeks)</label>
          <input 
            type="number"
            value={fbForm.postPromoPeriodWeeks}
            onChange={e => setFbForm({...fbForm, postPromoPeriodWeeks: parseInt(e.target.value)})}
            min="1"
            max="12"
          />
        </div>
      </div>
      
      <button className="btn-primary" onClick={detectForwardBuy} disabled={loading}>
        {loading ? 'Detecting...' : 'Detect Forward Buy'}
      </button>

      {results && results.forwardBuyDetected !== undefined && (
        <div className="results-section">
          <h3>Forward Buy Results</h3>
          
          <div className="severity-badge" data-severity={results.severity?.toLowerCase()}>
            {results.forwardBuyDetected ? results.severity || 'DETECTED' : 'NONE'} FORWARD BUYING
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Gross Incremental</div>
              <div className="metric-value">{(results.grossIncremental || 0).toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card warning">
              <div className="metric-label">Forward Buy Volume</div>
              <div className="metric-value">{(results.totalDip || 0).toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card highlight">
              <div className="metric-label">Net Impact</div>
              <div className="metric-value">{(results.netImpact || 0).toLocaleString()}</div>
              <div className="metric-unit">units</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Dip Percentage</div>
              <div className="metric-value">{(results.dipPercentage || 0).toFixed(1)}%</div>
              <div className="metric-unit">percent</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Recovery Week</div>
              <div className="metric-value">{results.recoveryWeek || 'N/A'}</div>
              <div className="metric-unit">week</div>
            </div>
          </div>

          {results.postPromoData && results.postPromoData.length > 0 && (
            <div className="chart-container">
              <h4>Post-Promotion Sales Trend</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={results.postPromoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actualSales" stroke="#ef4444" name="Actual Sales" />
                  <Line type="monotone" dataKey="baseline" stroke="#8884d8" name="Baseline" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {results.recommendations && (
            <div className="recommendations">
              <h4>Recommendations</h4>
              <ul>
                {(results?.recommendations || []).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <p className="subtitle">Advanced promotion analytics and insights</p>
      </div>

      <div className="analytics-tabs">
        <button 
          className={activeTab === 'baseline' ? 'active' : ''} 
          onClick={() => setActiveTab('baseline')}
        >
          📊 Baseline Calculation
        </button>
        <button 
          className={activeTab === 'cannibalization' ? 'active' : ''} 
          onClick={() => setActiveTab('cannibalization')}
        >
          🔄 Cannibalization
        </button>
        <button 
          className={activeTab === 'forwardbuy' ? 'active' : ''} 
          onClick={() => setActiveTab('forwardbuy')}
        >
          📦 Forward Buy
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'baseline' && renderBaselineTab()}
        {activeTab === 'cannibalization' && renderCannibalizationTab()}
        {activeTab === 'forwardbuy' && renderForwardBuyTab()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
