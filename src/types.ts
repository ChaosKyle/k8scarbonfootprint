import { DataSourceJsonData, KeyValue } from '@grafana/data';

// App configuration interface
export interface AppConfig {
  enabled: boolean;
  carbonIntensityApiKey?: string;
  electricityMapsApiKey?: string;
  defaultRefreshInterval: number;
  enableOptimizationRecommendations: boolean;
}

// Data source configuration
export interface CarbonDataSourceOptions extends DataSourceJsonData {
  kubernetesApiUrl?: string;
  cloudProvider: 'aws' | 'azure' | 'gcp';
  region: string;
  clusterName: string;
  prometheusUrl?: string;
  enableCloudMetrics: boolean;
  refreshInterval: number;
}

// Secure data source configuration (encrypted)
export interface CarbonDataSourceSecureOptions {
  kubernetesToken?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
  azureClientId?: string;
  azureClientSecret?: string;
  azureTenantId?: string;
  gcpServiceAccountKey?: string;
}

// Carbon calculation types
export interface CarbonMetrics {
  timestamp: number;
  co2Emissions: number; // grams CO2
  energyConsumption: number; // kWh
  gridIntensity: number; // gCO2/kWh
  source: 'calculated' | 'estimated';
}

// Kubernetes resource types
export interface KubernetesResource {
  name: string;
  namespace: string;
  kind: string;
  labels: KeyValue<string>;
  annotations: KeyValue<string>;
  carbonMetrics: CarbonMetrics[];
}

export interface PodMetrics extends KubernetesResource {
  kind: 'Pod';
  nodeName: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkTraffic: number;
}

export interface NodeMetrics extends KubernetesResource {
  kind: 'Node';
  instanceType: string;
  cpuCapacity: number;
  memoryCapacity: number;
  storageCapacity: number;
  pods: PodMetrics[];
}

// Cloud provider specific types
export interface CloudInstanceSpecs {
  instanceType: string;
  vcpus: number;
  memoryGb: number;
  networkPerformance: string;
  storageType: string;
  tdp: number; // Thermal Design Power in watts
}

// Optimization recommendation types
export interface OptimizationRecommendation {
  id: string;
  type: 'rightsizing' | 'scheduling' | 'region-migration' | 'instance-type';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedSavings: {
    co2Percent: number;
    costPercent?: number;
  };
  resourceTarget: {
    kind: string;
    name: string;
    namespace: string;
  };
  actionRequired: string;
  priority: number;
}

// Query types for data source
export interface CarbonQuery {
  refId: string;
  queryType: 'timeseries' | 'table' | 'single-value';
  resourceType: 'pod' | 'node' | 'namespace' | 'cluster';
  aggregation: 'sum' | 'avg' | 'max' | 'min';
  groupBy: string[];
  filters: {
    namespace?: string;
    labels?: KeyValue<string>;
  };
  timeRange: {
    from: string;
    to: string;
  };
}

// Panel configuration types
export interface CarbonGaugeOptions {
  unit: 'gCO2' | 'kgCO2' | 'tCO2';
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  showOptimizationTip: boolean;
}

export interface CarbonHeatmapOptions {
  xAxis: 'time' | 'namespace' | 'node';
  yAxis: 'pod' | 'namespace' | 'node';
  colorScale: 'linear' | 'log';
  showLabels: boolean;
}

export interface CarbonTreemapOptions {
  groupBy: 'namespace' | 'node' | 'labels';
  colorMetric: 'co2' | 'energy' | 'cost';
  showValues: boolean;
  maxDepth: number;
}