import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  TestDataSourceResponse,
} from '@grafana/data';

import { CarbonDataSourceOptions, CarbonQuery, CarbonDataSourceSecureOptions } from '../types';
import { CarbonMetricsCollector } from './CarbonMetricsCollector';

export class CarbonDataSource extends DataSourceApi<CarbonQuery, CarbonDataSourceOptions> {
  private metricsCollector: CarbonMetricsCollector;

  constructor(
    instanceSettings: DataSourceInstanceSettings<CarbonDataSourceOptions>,
    private readonly secureJsonData?: CarbonDataSourceSecureOptions
  ) {
    super(instanceSettings);
    
    this.metricsCollector = new CarbonMetricsCollector({
      kubernetesApiUrl: instanceSettings.jsonData.kubernetesApiUrl,
      kubernetesToken: secureJsonData?.kubernetesToken,
      cloudProvider: instanceSettings.jsonData.cloudProvider,
      region: instanceSettings.jsonData.region,
      clusterName: instanceSettings.jsonData.clusterName,
      prometheusUrl: instanceSettings.jsonData.prometheusUrl,
      refreshInterval: instanceSettings.jsonData.refreshInterval || 30000,
      secureData: secureJsonData,
    });
  }

  async query(request: DataQueryRequest<CarbonQuery>): Promise<DataQueryResponse> {
    const { targets, range } = request;
    
    try {
      const data = await Promise.all(
        targets.map(async (target) => {
          if (target.hide) {
            return { refId: target.refId, frames: [] };
          }

          const timeRange = {
            from: range?.from.toISOString() || '',
            to: range?.to.toISOString() || '',
          };

          const queryWithRange = { ...target, timeRange };
          const frames = await this.metricsCollector.collectMetrics(queryWithRange);
          
          return {
            refId: target.refId,
            frames,
          };
        })
      );

      return { data: data.flatMap(d => d.frames) };
    } catch (error) {
      console.error('Error executing carbon footprint query:', error);
      throw error;
    }
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    try {
      // Test Kubernetes API connectivity
      await this.metricsCollector.testKubernetesConnection();
      
      // Test cloud provider API connectivity if enabled
      if (this.instanceSettings.jsonData.enableCloudMetrics) {
        await this.metricsCollector.testCloudConnection();
      }

      return {
        status: 'success',
        message: 'Successfully connected to Kubernetes cluster and cloud provider APIs',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  getDefaultQuery(): Partial<CarbonQuery> {
    return {
      queryType: 'timeseries',
      resourceType: 'cluster',
      aggregation: 'sum',
      groupBy: ['namespace'],
      filters: {},
    };
  }
}