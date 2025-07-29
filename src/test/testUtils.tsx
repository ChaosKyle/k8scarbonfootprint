import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeContext } from '@grafana/ui';
import { GrafanaTheme2, createTheme } from '@grafana/data';

// Mock theme for testing
const mockTheme: GrafanaTheme2 = createTheme();

// Custom render function with theme provider
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={mockTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test utilities for carbon footprint data
export const createMockDataSourceInstanceSettings = (overrides = {}) => ({
  id: 1,
  uid: 'test-ds-uid',
  type: 'k8scarbonfootprint-datasource',
  name: 'Test Carbon Datasource',
  url: '',
  access: 'proxy' as const,
  jsonData: {
    kubernetesApiUrl: 'https://kubernetes.default.svc',
    cloudProvider: 'aws' as const,
    region: 'us-west-2',
    clusterName: 'test-cluster',
    prometheusUrl: 'http://prometheus.monitoring.svc:9090',
    enableCloudMetrics: true,
    refreshInterval: 30000,
    ...overrides,
  },
  secureJsonFields: {},
  readOnly: false,
  withCredentials: false,
  isDefault: false,
  database: '',
  user: '',
  basicAuth: false,
  basicAuthUser: '',
  meta: {
    id: 'k8scarbonfootprint-datasource',
    name: 'K8s Carbon Footprint',
    type: 'datasource',
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
    queryOptions: {},
  },
});

export const createMockCarbonQuery = (overrides = {}) => ({
  refId: 'A',
  queryType: 'timeseries' as const,
  resourceType: 'cluster' as const,
  aggregation: 'sum' as const,
  groupBy: ['namespace'],
  filters: {},
  timeRange: {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  },
  ...overrides,
});

export const createMockQueryRequest = (queries = [createMockCarbonQuery()]) => ({
  app: 'dashboard',
  requestId: 'test-request',
  timezone: 'UTC',
  panelId: 1,
  dashboardId: 1,
  range: {
    from: new Date(Date.now() - 24 * 60 * 60 * 1000),
    to: new Date(),
    raw: {
      from: 'now-24h',
      to: 'now',
    },
  },
  timeInfo: '',
  interval: '1m',
  intervalMs: 60000,
  maxDataPoints: 1440,
  scopedVars: {},
  targets: queries,
  cacheTimeout: '',
  queryCachingTTL: 0,
  headers: {},
  hideFromInspector: false,
});

// Mock data frame for testing
export const createMockDataFrame = (name: string, fields: Array<{ name: string; values: any[] }>) => ({
  name,
  refId: 'A',
  fields: fields.map(field => ({
    name: field.name,
    type: 'number',
    config: {},
    values: field.values,
    labels: {},
  })),
  length: fields[0]?.values.length || 0,
  meta: {
    type: 'timeseries-multi',
  },
});

// Helper to create mock carbon metrics
export const createMockCarbonMetrics = (count: number = 10, baseValue: number = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i - 1) * 60000,
    co2Emissions: baseValue + Math.random() * 50,
    energyConsumption: (baseValue + Math.random() * 50) / 500,
    gridIntensity: 400 + Math.random() * 200,
    source: 'calculated' as const,
  }));
};

// Helper to wait for async operations in tests
export const waitForAsync = (ms: number = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock Kubernetes resources
export const createMockPod = (name: string, namespace: string = 'default', overrides = {}) => ({
  name,
  namespace,
  kind: 'Pod' as const,
  labels: {
    app: name.split('-')[0],
    version: 'v1.0.0',
    ...overrides,
  },
  annotations: {},
  carbonMetrics: createMockCarbonMetrics(5, 50),
  nodeName: 'node-1',
  cpuUsage: Math.random() * 1000,
  memoryUsage: Math.random() * 1024 * 1024 * 1024,
  storageUsage: Math.random() * 10 * 1024 * 1024 * 1024,
  networkTraffic: Math.random() * 100 * 1024 * 1024,
});

export const createMockNode = (name: string, instanceType: string = 'm5.large', overrides = {}) => ({
  name,
  namespace: '',
  kind: 'Node' as const,
  labels: {
    'beta.kubernetes.io/instance-type': instanceType,
    'topology.kubernetes.io/zone': 'us-west-2a',
    'kubernetes.io/os': 'linux',
    ...overrides,
  },
  annotations: {},
  carbonMetrics: createMockCarbonMetrics(5, 200),
  instanceType,
  cpuCapacity: 2000,
  memoryCapacity: 8 * 1024 * 1024 * 1024,
  storageCapacity: 20 * 1024 * 1024 * 1024,
  pods: [],
});

// Security test helpers
export const expectNoSecurityViolations = (component: any) => {
  // Check for common security issues in rendered components
  const container = component.container || component;
  
  // Check for potential XSS vulnerabilities
  expect(container.innerHTML).not.toMatch(/<script/i);
  expect(container.innerHTML).not.toMatch(/javascript:/i);
  expect(container.innerHTML).not.toMatch(/data:text\/html/i);
  
  // Check for exposed sensitive data patterns
  expect(container.innerHTML).not.toMatch(/password|secret|token|key/i);
};

// Performance test helpers
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  await waitForAsync(0); // Allow for async rendering
  const end = performance.now();
  return end - start;
};

// Accessibility test helpers
export const expectAccessibleContent = (container: Element) => {
  // Check for basic accessibility requirements
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    expect(heading.textContent).toBeTruthy();
  });
  
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    expect(
      button.textContent || 
      button.getAttribute('aria-label') || 
      button.getAttribute('title')
    ).toBeTruthy();
  });
  
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img.getAttribute('alt')).toBeTruthy();
  });
};