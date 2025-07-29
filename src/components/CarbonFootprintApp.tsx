import React from 'react';
import { AppRootProps } from '@grafana/data';
import { AppConfig } from '../types';

interface Props extends AppRootProps<AppConfig> {}

export const CarbonFootprintApp: React.FC<Props> = ({ meta, ...props }) => {
  return (
    <div className="k8s-carbon-footprint-app">
      <div className="page-container">
        <div className="page-header">
          <h1>Kubernetes Carbon Footprint Monitor</h1>
          <p>Monitor and optimize the carbon impact of your Kubernetes workloads</p>
        </div>
        
        <div className="app-content">
          {/* Main app content will be rendered here */}
          <div className="welcome-section">
            <h2>Welcome to K8s Carbon Footprint</h2>
            <p>
              This plugin helps you monitor and visualize the carbon footprint 
              of your Kubernetes workloads across cloud providers.
            </p>
            
            <div className="quick-actions">
              <a href="/plugins/k8scarbonfootprint?page=configuration" className="btn btn-primary">
                Configure Data Sources
              </a>
              <a href="/plugins/k8scarbonfootprint?page=dashboards" className="btn btn-secondary">
                View Dashboards
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};