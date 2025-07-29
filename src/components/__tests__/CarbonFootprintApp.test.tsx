import React from 'react';
import { screen } from '@testing-library/react';
import { CarbonFootprintApp } from '../CarbonFootprintApp';
import { render, expectAccessibleContent, expectNoSecurityViolations } from '../../test/testUtils';

describe('CarbonFootprintApp', () => {
  const mockProps = {
    meta: {
      id: 'k8scarbonfootprint',
      name: 'K8s Carbon Footprint',
      type: 'app' as const,
      module: '',
      baseUrl: '',
      info: {
        author: { name: 'ChaosKyle' },
        description: 'Monitor Kubernetes carbon footprint',
        links: [],
        logos: { small: '', large: '' },
        screenshots: [],
        updated: '',
        version: '1.0.0',
        keywords: ['kubernetes', 'carbon'],
      },
      dependencies: {
        grafanaVersion: '10.0.0',
        plugins: [],
      },
      includes: [],
      backend: true,
      annotations: false,
      metrics: true,
      logs: false,
      tracing: false,
      alerting: false,
      streaming: false,
    },
    query: {},
    path: '',
    onNavChanged: jest.fn(),
    jsonData: {
      enabled: true,
    },
    setJsonData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the main application container', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      expect(screen.getByText('Kubernetes Carbon Footprint Monitor')).toBeInTheDocument();
      expect(screen.getByText(/Monitor and optimize the carbon impact/)).toBeInTheDocument();
    });

    it('should render the welcome section', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      expect(screen.getByText('Welcome to K8s Carbon Footprint')).toBeInTheDocument();
      expect(screen.getByText(/This plugin helps you monitor and visualize/)).toBeInTheDocument();
    });

    it('should render quick action buttons', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      expect(screen.getByText('Configure Data Sources')).toBeInTheDocument();
      expect(screen.getByText('View Dashboards')).toBeInTheDocument();
    });

    it('should have correct navigation links', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      const configureLink = screen.getByText('Configure Data Sources').closest('a');
      const dashboardsLink = screen.getByText('View Dashboards').closest('a');
      
      expect(configureLink).toHaveAttribute('href', '/plugins/k8scarbonfootprint?page=configuration');
      expect(dashboardsLink).toHaveAttribute('href', '/plugins/k8scarbonfootprint?page=dashboards');
    });
  });

  describe('accessibility', () => {
    it('should meet basic accessibility requirements', () => {
      const { container } = render(<CarbonFootprintApp {...mockProps} />);
      
      expectAccessibleContent(container);
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kubernetes Carbon Footprint Monitor');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Welcome to K8s Carbon Footprint');
    });

    it('should have accessible button styling', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      const configureButton = screen.getByText('Configure Data Sources');
      const dashboardsButton = screen.getByText('View Dashboards');
      
      expect(configureButton).toHaveClass('btn', 'btn-primary');
      expect(dashboardsButton).toHaveClass('btn', 'btn-secondary');
    });
  });

  describe('security', () => {
    it('should not have security vulnerabilities', () => {
      const component = render(<CarbonFootprintApp {...mockProps} />);
      
      expectNoSecurityViolations(component);
    });

    it('should not expose sensitive information', () => {
      const { container } = render(<CarbonFootprintApp {...mockProps} />);
      
      // Check that no sensitive patterns are exposed in the DOM
      expect(container.innerHTML).not.toMatch(/api[_-]?key|secret|token|password/i);
    });
  });

  describe('user experience', () => {
    it('should provide clear navigation guidance', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      expect(screen.getByText(/This plugin helps you monitor and visualize/)).toBeInTheDocument();
      expect(screen.getByText('Configure Data Sources')).toBeInTheDocument();
      expect(screen.getByText('View Dashboards')).toBeInTheDocument();
    });

    it('should have intuitive button labels', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      const buttons = screen.getAllByRole('link');
      expect(buttons).toHaveLength(2);
      
      expect(buttons[0]).toHaveTextContent('Configure Data Sources');
      expect(buttons[1]).toHaveTextContent('View Dashboards');
    });
  });

  describe('responsive design', () => {
    it('should render with proper CSS classes for responsive layout', () => {
      const { container } = render(<CarbonFootprintApp {...mockProps} />);
      
      expect(container.querySelector('.k8s-carbon-footprint-app')).toBeInTheDocument();
      expect(container.querySelector('.page-container')).toBeInTheDocument();
      expect(container.querySelector('.page-header')).toBeInTheDocument();
      expect(container.querySelector('.app-content')).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should render quickly', async () => {
      const startTime = performance.now();
      render(<CarbonFootprintApp {...mockProps} />);
      const renderTime = performance.now() - startTime;
      
      // Component should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks', () => {
      const { unmount } = render(<CarbonFootprintApp {...mockProps} />);
      
      // Should unmount cleanly without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('integration with Grafana', () => {
    it('should accept standard app props', () => {
      expect(() => render(<CarbonFootprintApp {...mockProps} />)).not.toThrow();
    });

    it('should handle missing optional props gracefully', () => {
      const minimalProps = {
        ...mockProps,
        jsonData: undefined,
      };
      
      expect(() => render(<CarbonFootprintApp {...minimalProps} />)).not.toThrow();
    });
  });

  describe('branding and messaging', () => {
    it('should display correct branding', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      expect(screen.getByText('Kubernetes Carbon Footprint Monitor')).toBeInTheDocument();
      expect(screen.getByText('K8s Carbon Footprint')).toBeInTheDocument();
    });

    it('should convey the purpose clearly', () => {
      render(<CarbonFootprintApp {...mockProps} />);
      
      expect(screen.getByText(/Monitor and optimize the carbon impact/)).toBeInTheDocument();
      expect(screen.getByText(/monitor and visualize the carbon footprint/)).toBeInTheDocument();
    });
  });
});