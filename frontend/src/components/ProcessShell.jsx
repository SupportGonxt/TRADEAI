import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';
import { FaChartLine, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import InsightBanner from './InsightBanner';
import apiClient from '../services/apiClient';
import { useUserSkillContext } from '../hooks/useUserSkillContext';

const ProcessShell = ({ module, entityId, entity, children }) => {
  const [metrics, setMetrics] = useState({});
  const [processModel, setProcessModel] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { skillLevel, isSimpleMode, isProMode } = useUserSkillContext();

  useEffect(() => {
    if (module && entityId) {
      loadMetrics();
      loadProcessModel();
    }
  }, [module, entityId]);

  const loadMetrics = async () => {
    try {
      const response = await apiClient.get(`/metrics/${module}/${entityId}`);
      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadProcessModel = async () => {
    try {
      setLoading(true);
      
      const companyType = entity?.company?.companyType || 'manufacturer';
      
      const modelResponse = await apiClient.get(`/process-model/${module}/${companyType}`);
      if (modelResponse.data.success) {
        setProcessModel(modelResponse.data.data);
      }
      
      const stageResponse = await apiClient.get(`/process-model/${module}/${companyType}/stage/${entityId}`);
      if (stageResponse.data.success) {
        const { currentStage: stage, allowedActions, nextBestAction } = stageResponse.data.data;
        setCurrentStage({
          ...stage,
          allowedActions,
          nextBestAction
        });
      }
    } catch (error) {
      console.error('Error loading process model:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopMetrics = () => {
    const metricArray = Object.values(metrics);
    if (isSimpleMode()) {
      return metricArray.slice(0, 3);
    }
    if (isProMode()) {
      return metricArray.slice(0, 6);
    }
    return metricArray.slice(0, 4);
  };

  const renderMetricCard = (metric) => {
    if (!metric || !metric.value) return null;

    return (
      <Col key={metric.id} xs={12} sm={6} md={isProMode() ? 2 : 3} className="mb-3">
        <Card className="h-100">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <small className="text-muted">{metric.name}</small>
              <FaChartLine className="text-primary" />
            </div>
            <h4 className="mb-0">{metric.formattedValue}</h4>
            {metric.trend && (
              <Badge bg={metric.trend === 'positive' ? 'success' : 'secondary'} className="mt-1">
                {metric.trend}
              </Badge>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const renderProcessStepper = () => {
    if (!processModel || !currentStage) return null;

    return (
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Process Stage: {currentStage.displayName}</h6>
            <Badge bg="primary">{currentStage.progress}% Complete</Badge>
          </div>
          <ProgressBar now={currentStage.progress} variant="primary" />
          <div className="d-flex justify-content-between mt-2">
            {(processModel?.stages || []).map((stage, idx) => (
              <div
                key={stage}
                className={`text-center ${stage === currentStage.name ? 'text-primary fw-bold' : 'text-muted'}`}
                style={{ fontSize: '0.75rem' }}
              >
                {stage === currentStage.name ? (
                  <FaCheckCircle className="text-primary" />
                ) : idx < processModel.stages.indexOf(currentStage.name) ? (
                  <FaCheckCircle className="text-success" />
                ) : (
                  <FaExclamationTriangle className="text-muted" />
                )}
                <div>{stage}</div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="process-shell">
      {/* Insight Banner */}
      <InsightBanner module={module} entityId={entityId} />

      {/* Process Stepper */}
      {!isSimpleMode() && processModel && currentStage && renderProcessStepper()}

      {/* Key Metrics */}
      {Object.keys(metrics).length > 0 && (
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0">Key Metrics</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {getTopMetrics().map(renderMetricCard)}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
};

export default ProcessShell;
