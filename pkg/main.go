package main

import (
	"context"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/ChaosKyle/k8scarbonfootprint/pkg/carbon"
)

func main() {
	// Initialize the plugin
	if err := datasource.Manage(
		"k8scarbonfootprint-datasource",
		carbon.NewDatasourceFactory(),
		datasource.ManageOpts{},
	); err != nil {
		log.DefaultLogger.Error("Failed to manage datasource", "error", err)
		os.Exit(1)
	}
}

// CarbonFootprintDatasource implements the datasource interface
type CarbonFootprintDatasource struct {
	backend.CallResourceHandler
	carbon.CarbonCalculator
	
	// Cloud provider clients
	kubernetesClient carbon.KubernetesClient
	cloudClient      carbon.CloudClient
}

// NewCarbonFootprintDatasource creates a new instance of the datasource
func NewCarbonFootprintDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Info("Creating new carbon footprint datasource instance")
	
	// Parse datasource configuration
	config, err := carbon.ParseDatasourceConfig(settings.JSONData, settings.DecryptedSecureJSONData)
	if err != nil {
		return nil, err
	}
	
	// Initialize Kubernetes client
	kubernetesClient, err := carbon.NewKubernetesClient(config.KubernetesConfig)
	if err != nil {
		return nil, err
	}
	
	// Initialize cloud provider client
	cloudClient, err := carbon.NewCloudClient(config.CloudConfig)
	if err != nil {
		return nil, err
	}
	
	// Initialize carbon calculator
	calculator := carbon.NewCarbonCalculator(config.CarbonConfig)
	
	return &CarbonFootprintDatasource{
		CarbonCalculator: calculator,
		kubernetesClient: kubernetesClient,
		cloudClient:      cloudClient,
	}, nil
}

// QueryData handles data queries
func (d *CarbonFootprintDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	log.DefaultLogger.Info("QueryData called", "queries", len(req.Queries))
	
	response := backend.NewQueryDataResponse()
	
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)
		response.Responses[q.RefID] = res
	}
	
	return response, nil
}

// query processes individual queries
func (d *CarbonFootprintDatasource) query(ctx context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	var response backend.DataResponse
	
	// Parse the query
	carbonQuery, err := carbon.ParseQuery(query.JSON)
	if err != nil {
		response.Error = err
		return response
	}
	
	// Collect metrics based on query type
	switch carbonQuery.ResourceType {
	case "cluster":
		metrics, err := d.collectClusterMetrics(ctx, carbonQuery)
		if err != nil {
			response.Error = err
			return response
		}
		response.Frames = metrics
		
	case "namespace":
		metrics, err := d.collectNamespaceMetrics(ctx, carbonQuery)
		if err != nil {
			response.Error = err
			return response
		}
		response.Frames = metrics
		
	case "node":
		metrics, err := d.collectNodeMetrics(ctx, carbonQuery)
		if err != nil {
			response.Error = err
			return response
		}
		response.Frames = metrics
		
	case "pod":
		metrics, err := d.collectPodMetrics(ctx, carbonQuery)
		if err != nil {
			response.Error = err
			return response
		}
		response.Frames = metrics
		
	default:
		response.Error = backend.NewDataError(backend.ErrorTypeQuery, "unknown resource type: "+carbonQuery.ResourceType)
	}
	
	return response
}

// CheckHealth handles health checks
func (d *CarbonFootprintDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	log.DefaultLogger.Info("CheckHealth called")
	
	var status = backend.HealthStatusOk
	var message = "Data source is working"
	
	// Test Kubernetes connection
	if err := d.kubernetesClient.TestConnection(ctx); err != nil {
		status = backend.HealthStatusError
		message = "Failed to connect to Kubernetes: " + err.Error()
		return &backend.CheckHealthResult{
			Status:  status,
			Message: message,
		}, nil
	}
	
	// Test cloud provider connection
	if err := d.cloudClient.TestConnection(ctx); err != nil {
		status = backend.HealthStatusError
		message = "Failed to connect to cloud provider: " + err.Error()
		return &backend.CheckHealthResult{
			Status:  status,
			Message: message,
		}, nil
	}
	
	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}

// collectClusterMetrics collects cluster-level carbon metrics
func (d *CarbonFootprintDatasource) collectClusterMetrics(ctx context.Context, query *carbon.Query) ([]*backend.DataFrame, error) {
	// Get cluster resources
	nodes, err := d.kubernetesClient.GetNodes(ctx)
	if err != nil {
		return nil, err
	}
	
	pods, err := d.kubernetesClient.GetPods(ctx, "")
	if err != nil {
		return nil, err
	}
	
	// Calculate carbon footprint
	carbonMetrics, err := d.CarbonCalculator.CalculateClusterCarbon(ctx, nodes, pods)
	if err != nil {
		return nil, err
	}
	
	// Convert to data frames
	return carbon.ConvertToDataFrames(carbonMetrics, query)
}

// collectNamespaceMetrics collects namespace-level carbon metrics
func (d *CarbonFootprintDatasource) collectNamespaceMetrics(ctx context.Context, query *carbon.Query) ([]*backend.DataFrame, error) {
	// Implementation for namespace metrics collection
	namespaces, err := d.kubernetesClient.GetNamespaces(ctx)
	if err != nil {
		return nil, err
	}
	
	var allMetrics []*carbon.Metrics
	for _, ns := range namespaces {
		pods, err := d.kubernetesClient.GetPods(ctx, ns.Name)
		if err != nil {
			continue
		}
		
		metrics, err := d.CarbonCalculator.CalculateNamespaceCarbon(ctx, ns, pods)
		if err != nil {
			continue
		}
		
		allMetrics = append(allMetrics, metrics...)
	}
	
	return carbon.ConvertToDataFrames(allMetrics, query)
}

// collectNodeMetrics collects node-level carbon metrics
func (d *CarbonFootprintDatasource) collectNodeMetrics(ctx context.Context, query *carbon.Query) ([]*backend.DataFrame, error) {
	nodes, err := d.kubernetesClient.GetNodes(ctx)
	if err != nil {
		return nil, err
	}
	
	var allMetrics []*carbon.Metrics
	for _, node := range nodes {
		pods, err := d.kubernetesClient.GetPodsOnNode(ctx, node.Name)
		if err != nil {
			continue
		}
		
		metrics, err := d.CarbonCalculator.CalculateNodeCarbon(ctx, node, pods)
		if err != nil {
			continue
		}
		
		allMetrics = append(allMetrics, metrics...)
	}
	
	return carbon.ConvertToDataFrames(allMetrics, query)
}

// collectPodMetrics collects pod-level carbon metrics
func (d *CarbonFootprintDatasource) collectPodMetrics(ctx context.Context, query *carbon.Query) ([]*backend.DataFrame, error) {
	namespace := ""
	if query.Filters != nil && query.Filters["namespace"] != nil {
		if ns, ok := query.Filters["namespace"].(string); ok {
			namespace = ns
		}
	}
	
	pods, err := d.kubernetesClient.GetPods(ctx, namespace)
	if err != nil {
		return nil, err
	}
	
	var allMetrics []*carbon.Metrics
	for _, pod := range pods {
		metrics, err := d.CarbonCalculator.CalculatePodCarbon(ctx, pod)
		if err != nil {
			continue
		}
		
		allMetrics = append(allMetrics, metrics...)
	}
	
	return carbon.ConvertToDataFrames(allMetrics, query)
}

// Dispose handles cleanup when the instance is destroyed
func (d *CarbonFootprintDatasource) Dispose() {
	log.DefaultLogger.Info("Disposing carbon footprint datasource")
	d.kubernetesClient.Close()
	d.cloudClient.Close()
}