import { CarbonMetrics, NodeMetrics, PodMetrics, OptimizationRecommendation } from '../types';

// Mock carbon metrics data
export const mockCarbonMetrics: CarbonMetrics[] = [
  {
    timestamp: Date.now() - 3600000, // 1 hour ago
    co2Emissions: 450.5,
    energyConsumption: 0.85,
    gridIntensity: 530,
    source: 'calculated',
  },
  {
    timestamp: Date.now() - 1800000, // 30 minutes ago
    co2Emissions: 520.3,
    energyConsumption: 0.98,
    gridIntensity: 530,
    source: 'calculated',
  },
  {
    timestamp: Date.now(),
    co2Emissions: 480.1,
    energyConsumption: 0.91,
    gridIntensity: 528,
    source: 'calculated',
  },
];

// Mock Kubernetes node data
export const mockNodeMetrics: NodeMetrics[] = [
  {
    name: 'node-1',
    namespace: '',
    kind: 'Node',
    labels: {
      'beta.kubernetes.io/instance-type': 'm5.large',
      'topology.kubernetes.io/zone': 'us-west-2a',
      'kubernetes.io/os': 'linux',
    },
    annotations: {},
    carbonMetrics: mockCarbonMetrics,
    instanceType: 'm5.large',
    cpuCapacity: 2000,
    memoryCapacity: 8 * 1024 * 1024 * 1024, // 8GB
    storageCapacity: 20 * 1024 * 1024 * 1024, // 20GB
    pods: [],
  },
  {
    name: 'node-2',
    namespace: '',
    kind: 'Node',
    labels: {
      'beta.kubernetes.io/instance-type': 'm5.xlarge',
      'topology.kubernetes.io/zone': 'us-west-2b',
      'kubernetes.io/os': 'linux',
    },
    annotations: {},
    carbonMetrics: mockCarbonMetrics.map(m => ({ ...m, co2Emissions: m.co2Emissions * 1.5 })),
    instanceType: 'm5.xlarge',
    cpuCapacity: 4000,
    memoryCapacity: 16 * 1024 * 1024 * 1024, // 16GB
    storageCapacity: 20 * 1024 * 1024 * 1024, // 20GB
    pods: [],
  },
];

// Mock Kubernetes pod data
export const mockPodMetrics: PodMetrics[] = [
  {
    name: 'web-app-1',
    namespace: 'production',
    kind: 'Pod',
    labels: {
      app: 'web-app',
      version: 'v1.2.3',
      environment: 'production',
    },
    annotations: {
      'deployment.kubernetes.io/revision': '5',
    },
    carbonMetrics: mockCarbonMetrics.map(m => ({ ...m, co2Emissions: m.co2Emissions * 0.3 })),
    nodeName: 'node-1',
    cpuUsage: 150,
    memoryUsage: 512 * 1024 * 1024, // 512MB
    storageUsage: 1 * 1024 * 1024 * 1024, // 1GB
    networkTraffic: 100 * 1024 * 1024, // 100MB
  },
  {
    name: 'web-app-2',
    namespace: 'production',
    kind: 'Pod',
    labels: {
      app: 'web-app',
      version: 'v1.2.3',
      environment: 'production',
    },
    annotations: {
      'deployment.kubernetes.io/revision': '5',
    },
    carbonMetrics: mockCarbonMetrics.map(m => ({ ...m, co2Emissions: m.co2Emissions * 0.25 })),
    nodeName: 'node-1',
    cpuUsage: 120,
    memoryUsage: 450 * 1024 * 1024, // 450MB
    storageUsage: 800 * 1024 * 1024, // 800MB
    networkTraffic: 80 * 1024 * 1024, // 80MB
  },
  {
    name: 'database-1',
    namespace: 'production',
    kind: 'Pod',
    labels: {
      app: 'postgres',
      version: '13.8',
      environment: 'production',
    },
    annotations: {
      'deployment.kubernetes.io/revision': '3',
    },
    carbonMetrics: mockCarbonMetrics.map(m => ({ ...m, co2Emissions: m.co2Emissions * 0.8 })),
    nodeName: 'node-2',
    cpuUsage: 800,
    memoryUsage: 2 * 1024 * 1024 * 1024, // 2GB
    storageUsage: 10 * 1024 * 1024 * 1024, // 10GB
    networkTraffic: 200 * 1024 * 1024, // 200MB
  },
  {
    name: 'prometheus-server',
    namespace: 'monitoring',
    kind: 'Pod',
    labels: {
      app: 'prometheus',
      component: 'server',
      environment: 'production',
    },
    annotations: {
      'prometheus.io/scrape': 'true',
    },
    carbonMetrics: mockCarbonMetrics.map(m => ({ ...m, co2Emissions: m.co2Emissions * 0.4 })),
    nodeName: 'node-2',
    cpuUsage: 300,
    memoryUsage: 1024 * 1024 * 1024, // 1GB
    storageUsage: 5 * 1024 * 1024 * 1024, // 5GB
    networkTraffic: 50 * 1024 * 1024, // 50MB
  },
];

// Mock optimization recommendations
export const mockOptimizationRecommendations: OptimizationRecommendation[] = [
  {
    id: 'rec-001',
    type: 'rightsizing',
    title: 'Reduce CPU allocation for web-app pods',
    description: 'web-app pods are using only 15% of requested CPU. Consider reducing CPU requests from 200m to 100m.',
    impact: 'medium',
    estimatedSavings: {
      co2Percent: 25,
      costPercent: 20,
    },
    resourceTarget: {
      kind: 'Pod',
      name: 'web-app-1',
      namespace: 'production',
    },
    actionRequired: 'Update deployment YAML to reduce CPU requests',
    priority: 8,
  },
  {
    id: 'rec-002',
    type: 'scheduling',
    title: 'Schedule workloads during low-carbon periods',
    description: 'Grid carbon intensity is 40% lower between 2-6 AM UTC. Consider scheduling batch jobs during this period.',
    impact: 'high',
    estimatedSavings: {
      co2Percent: 40,
      costPercent: 15,
    },
    resourceTarget: {
      kind: 'CronJob',
      name: 'data-processing',
      namespace: 'production',
    },
    actionRequired: 'Update CronJob schedule to run during low-carbon hours',
    priority: 9,
  },
  {
    id: 'rec-003',
    type: 'region-migration',
    title: 'Migrate to lower-carbon region',
    description: 'us-west-1 has 30% lower carbon intensity than current region us-west-2.',
    impact: 'high',
    estimatedSavings: {
      co2Percent: 30,
      costPercent: 5,
    },
    resourceTarget: {
      kind: 'Cluster',
      name: 'production-cluster',
      namespace: '',
    },
    actionRequired: 'Plan cluster migration to us-west-1',
    priority: 7,
  },
  {
    id: 'rec-004',
    type: 'instance-type',
    title: 'Switch to more efficient instance type',
    description: 'M6i instances provide 15% better performance per watt than M5 instances.',
    impact: 'medium',
    estimatedSavings: {
      co2Percent: 15,
      costPercent: 10,
    },
    resourceTarget: {
      kind: 'Node',
      name: 'node-1',
      namespace: '',
    },
    actionRequired: 'Update node group to use m6i.large instance type',
    priority: 6,
  },
];

// Mock time series data for charts
export const generateMockTimeSeriesData = (
  hours: number = 24,
  baseValue: number = 500,
  variation: number = 0.2
) => {
  const data = [];
  const now = Date.now();
  const intervalMs = (hours * 60 * 60 * 1000) / 100; // 100 data points

  for (let i = 0; i < 100; i++) {
    const timestamp = now - (hours * 60 * 60 * 1000) + (i * intervalMs);
    const randomVariation = (Math.random() - 0.5) * 2 * variation;
    const value = baseValue * (1 + randomVariation);
    
    data.push({
      timestamp,
      value: Math.max(0, value), // Ensure non-negative values
    });
  }

  return data;
};

// Mock namespace data
export const mockNamespaces = [
  {
    name: 'production',
    labels: {
      environment: 'production',
      team: 'platform',
    },
    pods: mockPodMetrics.filter(p => p.namespace === 'production'),
  },
  {
    name: 'monitoring',
    labels: {
      environment: 'production',
      team: 'observability',
    },
    pods: mockPodMetrics.filter(p => p.namespace === 'monitoring'),
  },
  {
    name: 'development',
    labels: {
      environment: 'development',
      team: 'engineering',
    },
    pods: [],
  },
];

// Mock cloud provider data
export const mockCloudProviders = {
  aws: {
    regions: [
      { code: 'us-west-1', name: 'US West (N. California)', carbonIntensity: 350 },
      { code: 'us-west-2', name: 'US West (Oregon)', carbonIntensity: 450 },
      { code: 'eu-west-1', name: 'Europe (Ireland)', carbonIntensity: 300 },
    ],
    instanceTypes: [
      { type: 'm5.large', vcpus: 2, memory: 8, tdp: 85, costPerHour: 0.096 },
      { type: 'm5.xlarge', vcpus: 4, memory: 16, tdp: 170, costPerHour: 0.192 },
      { type: 'm6i.large', vcpus: 2, memory: 8, tdp: 72, costPerHour: 0.0864 },
    ],
  },
  azure: {
    regions: [
      { code: 'westus2', name: 'West US 2', carbonIntensity: 420 },
      { code: 'eastus', name: 'East US', carbonIntensity: 380 },
      { code: 'northeurope', name: 'North Europe', carbonIntensity: 250 },
    ],
    instanceTypes: [
      { type: 'Standard_D2s_v3', vcpus: 2, memory: 8, tdp: 90, costPerHour: 0.096 },
      { type: 'Standard_D4s_v3', vcpus: 4, memory: 16, tdp: 180, costPerHour: 0.192 },
    ],
  },
  gcp: {
    regions: [
      { code: 'us-west1', name: 'Oregon', carbonIntensity: 400 },
      { code: 'us-central1', name: 'Iowa', carbonIntensity: 520 },
      { code: 'europe-west4', name: 'Netherlands', carbonIntensity: 280 },
    ],
    instanceTypes: [
      { type: 'n1-standard-2', vcpus: 2, memory: 7.5, tdp: 88, costPerHour: 0.0950 },
      { type: 'n1-standard-4', vcpus: 4, memory: 15, tdp: 176, costPerHour: 0.1900 },
    ],
  },
};

// Mock query responses
export const mockQueryResponse = {
  cluster: {
    data: [
      {
        refId: 'A',
        frames: [
          {
            schema: {
              refId: 'A',
              fields: [
                { name: 'time', type: 'time' },
                { name: 'co2_emissions', type: 'number', config: { unit: 'gCO2' } },
                { name: 'energy_consumption', type: 'number', config: { unit: 'kWh' } },
              ],
            },
            data: {
              values: [
                generateMockTimeSeriesData(24).map(d => d.timestamp),
                generateMockTimeSeriesData(24, 1500, 0.15).map(d => d.value),
                generateMockTimeSeriesData(24, 3.2, 0.1).map(d => d.value),
              ],
            },
          },
        ],
      },
    ],
  },
  namespace: {
    data: [
      {
        refId: 'B',
        frames: [
          {
            schema: {
              refId: 'B',
              fields: [
                { name: 'time', type: 'time' },
                { name: 'namespace', type: 'string' },
                { name: 'co2_emissions', type: 'number', config: { unit: 'gCO2' } },
                { name: 'pod_count', type: 'number' },
              ],
            },
            data: {
              values: [
                Array(300).fill(0).map((_, i) => Date.now() - (299 - i) * 60000),
                Array(100).fill('production').concat(Array(100).fill('monitoring')).concat(Array(100).fill('kube-system')),
                generateMockTimeSeriesData(24, 800, 0.2).map(d => d.value)
                  .concat(generateMockTimeSeriesData(24, 200, 0.3).map(d => d.value))
                  .concat(generateMockTimeSeriesData(24, 100, 0.4).map(d => d.value)),
                Array(100).fill(3).concat(Array(100).fill(1)).concat(Array(100).fill(5)),
              ],
            },
          },
        ],
      },
    ],
  },
};