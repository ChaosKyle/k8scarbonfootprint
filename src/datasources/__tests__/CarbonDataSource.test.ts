import { CarbonDataSource } from '../CarbonDataSource';
import { CarbonDataSourceOptions, CarbonDataSourceSecureOptions } from '../../types';
import { createMockDataSourceInstanceSettings, createMockQueryRequest } from '../../test/testUtils';

describe('CarbonDataSource', () => {
  let dataSource: CarbonDataSource;
  let mockInstanceSettings: any;
  let mockSecureData: CarbonDataSourceSecureOptions;

  beforeEach(() => {
    mockSecureData = {
      kubernetesToken: 'mock-k8s-token',
      awsAccessKey: 'mock-aws-key',
      awsSecretKey: 'mock-aws-secret',
    };

    mockInstanceSettings = createMockDataSourceInstanceSettings({
      cloudProvider: 'aws',
      region: 'us-west-2',
      clusterName: 'test-cluster',
      enableCloudMetrics: true,
    });

    dataSource = new CarbonDataSource(mockInstanceSettings, mockSecureData);
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(dataSource).toBeInstanceOf(CarbonDataSource);
      expect(dataSource.type).toBe('k8scarbonfootprint-datasource');
      expect(dataSource.name).toBe('Test Carbon Datasource');
    });

    it('should handle missing secure data gracefully', () => {
      expect(() => {
        new CarbonDataSource(mockInstanceSettings, undefined);
      }).not.toThrow();
    });
  });

  describe('query method', () => {
    it('should execute cluster-level queries successfully', async () => {
      const request = createMockQueryRequest([
        {
          refId: 'A',
          queryType: 'timeseries',
          resourceType: 'cluster',
          aggregation: 'sum',
          groupBy: ['namespace'],
          filters: {},
          timeRange: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
      ]);

      const response = await dataSource.query(request);

      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].refId).toBe('A');
    });

    it('should execute namespace-level queries successfully', async () => {
      const request = createMockQueryRequest([
        {
          refId: 'B',
          queryType: 'timeseries',
          resourceType: 'namespace',
          aggregation: 'sum',
          groupBy: ['pod'],
          filters: { namespace: 'production' },
          timeRange: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
      ]);

      const response = await dataSource.query(request);

      expect(response.data).toBeDefined();
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0].refId).toBe('B');
    });

    it('should handle multiple queries in a single request', async () => {
      const request = createMockQueryRequest([
        {
          refId: 'A',
          queryType: 'timeseries',
          resourceType: 'cluster',
          aggregation: 'sum',
          groupBy: ['namespace'],
          filters: {},
          timeRange: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
        {
          refId: 'B',
          queryType: 'table',
          resourceType: 'pod',
          aggregation: 'avg',
          groupBy: ['namespace'],
          filters: {},
          timeRange: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
      ]);

      const response = await dataSource.query(request);

      expect(response.data).toBeDefined();
      expect(response.data.length).toBe(2);
      expect(response.data.map(d => d.refId)).toEqual(['A', 'B']);
    });

    it('should skip hidden queries', async () => {
      const request = createMockQueryRequest([
        {
          refId: 'A',
          hide: true,
          queryType: 'timeseries',
          resourceType: 'cluster',
          aggregation: 'sum',
          groupBy: ['namespace'],
          filters: {},
          timeRange: {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
        },
      ]);

      const response = await dataSource.query(request);

      expect(response.data).toBeDefined();
      expect(response.data.length).toBe(0);
    });

    it('should handle query errors gracefully', async () => {
      // Mock a failing query by providing invalid data
      const request = createMockQueryRequest([
        {
          refId: 'A',
          queryType: 'invalid-type' as any,
          resourceType: 'invalid-resource' as any,
          aggregation: 'sum',
          groupBy: ['namespace'],
          filters: {},
          timeRange: {
            from: 'invalid-date',
            to: 'invalid-date',
          },
        },
      ]);

      await expect(dataSource.query(request)).rejects.toThrow();
    });
  });

  describe('testDatasource method', () => {
    it('should return success when connections are valid', async () => {
      const result = await dataSource.testDatasource();

      expect(result.status).toBe('success');
      expect(result.message).toContain('Successfully connected');
    });

    it('should handle connection failures', async () => {
      // Create a datasource with invalid configuration
      const invalidSettings = createMockDataSourceInstanceSettings({
        kubernetesApiUrl: '',
      });
      const invalidDataSource = new CarbonDataSource(invalidSettings, {});

      const result = await invalidDataSource.testDatasource();

      expect(result.status).toBe('error');
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('getDefaultQuery method', () => {
    it('should return a valid default query', () => {
      const defaultQuery = dataSource.getDefaultQuery();

      expect(defaultQuery).toBeDefined();
      expect(defaultQuery.queryType).toBe('timeseries');
      expect(defaultQuery.resourceType).toBe('cluster');
      expect(defaultQuery.aggregation).toBe('sum');
      expect(defaultQuery.groupBy).toEqual(['namespace']);
      expect(defaultQuery.filters).toEqual({});
    });
  });

  describe('security considerations', () => {
    it('should not expose sensitive data in error messages', async () => {
      const request = createMockQueryRequest([
        {
          refId: 'A',
          queryType: 'timeseries',
          resourceType: 'cluster',
          aggregation: 'sum',
          groupBy: ['namespace'],
          filters: {},
          timeRange: {
            from: 'invalid-date',
            to: 'invalid-date',
          },
        },
      ]);

      try {
        await dataSource.query(request);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain('mock-k8s-token');
        expect(errorMessage).not.toContain('mock-aws-key');
        expect(errorMessage).not.toContain('mock-aws-secret');
      }
    });

    it('should handle undefined secure data without exposing configuration', () => {
      const dataSourceWithoutSecureData = new CarbonDataSource(mockInstanceSettings, undefined);
      
      expect(() => {
        dataSourceWithoutSecureData.getDefaultQuery();
      }).not.toThrow();
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of queries efficiently', async () => {
      const manyQueries = Array.from({ length: 10 }, (_, i) => ({
        refId: `query-${i}`,
        queryType: 'timeseries' as const,
        resourceType: 'pod' as const,
        aggregation: 'sum' as const,
        groupBy: ['namespace'],
        filters: {},
        timeRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      }));

      const request = createMockQueryRequest(manyQueries);
      const startTime = performance.now();
      
      const response = await dataSource.query(request);
      
      const executionTime = performance.now() - startTime;
      
      expect(response.data).toBeDefined();
      expect(response.data.length).toBe(10);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});