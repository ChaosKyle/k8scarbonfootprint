package carbon

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	corev1 "k8s.io/api/core/v1"
)

// CarbonCalculator handles CO2 emission calculations for Kubernetes resources
type CarbonCalculator interface {
	CalculateClusterCarbon(ctx context.Context, nodes []*corev1.Node, pods []*corev1.Pod) ([]*Metrics, error)
	CalculateNamespaceCarbon(ctx context.Context, namespace *corev1.Namespace, pods []*corev1.Pod) ([]*Metrics, error)
	CalculateNodeCarbon(ctx context.Context, node *corev1.Node, pods []*corev1.Pod) ([]*Metrics, error)
	CalculatePodCarbon(ctx context.Context, pod *corev1.Pod) ([]*Metrics, error)
}

// carbonCalculator implements the CarbonCalculator interface
type carbonCalculator struct {
	config         *CarbonConfig
	gridIntensity  GridIntensityProvider
	instanceSpecs  InstanceSpecProvider
	energyModels   EnergyModelProvider
}

// CarbonConfig holds configuration for carbon calculations
type CarbonConfig struct {
	GridIntensityAPIKey    string  `json:"gridIntensityApiKey"`
	ElectricityMapsAPIKey  string  `json:"electricityMapsApiKey"`
	DefaultGridIntensity   float64 `json:"defaultGridIntensity"`   // gCO2/kWh
	PUE                    float64 `json:"pue"`                    // Power Usage Effectiveness
	EnableNetworkAccounting bool   `json:"enableNetworkAccounting"`
	EnableStorageAccounting bool   `json:"enableStorageAccounting"`
}

// Metrics represents carbon footprint metrics for a resource
type Metrics struct {
	Timestamp        time.Time         `json:"timestamp"`
	ResourceType     string           `json:"resourceType"`
	ResourceName     string           `json:"resourceName"`
	Namespace        string           `json:"namespace,omitempty"`
	NodeName         string           `json:"nodeName,omitempty"`
	CO2Emissions     float64          `json:"co2Emissions"`     // grams CO2
	EnergyConsumption float64         `json:"energyConsumption"` // kWh
	GridIntensity    float64          `json:"gridIntensity"`    // gCO2/kWh
	Source           string           `json:"source"`           // "calculated", "estimated"
	Labels           map[string]string `json:"labels,omitempty"`
	
	// Resource-specific metrics
	CPUUsage      float64 `json:"cpuUsage,omitempty"`      // millicores
	MemoryUsage   float64 `json:"memoryUsage,omitempty"`   // bytes
	StorageUsage  float64 `json:"storageUsage,omitempty"`  // bytes
	NetworkTraffic float64 `json:"networkTraffic,omitempty"` // bytes
}

// Query represents a carbon footprint query
type Query struct {
	RefID        string                 `json:"refId"`
	QueryType    string                 `json:"queryType"`    // "timeseries", "table", "single-value"
	ResourceType string                 `json:"resourceType"` // "cluster", "namespace", "node", "pod"
	Aggregation  string                 `json:"aggregation"`  // "sum", "avg", "max", "min"
	GroupBy      []string               `json:"groupBy"`
	Filters      map[string]interface{} `json:"filters"`
	TimeRange    struct {
		From string `json:"from"`
		To   string `json:"to"`
	} `json:"timeRange"`
}

// NewCarbonCalculator creates a new carbon calculator instance
func NewCarbonCalculator(config *CarbonConfig) CarbonCalculator {
	return &carbonCalculator{
		config:        config,
		gridIntensity: NewGridIntensityProvider(config),
		instanceSpecs: NewInstanceSpecProvider(),
		energyModels:  NewEnergyModelProvider(),
	}
}

// CalculateClusterCarbon calculates carbon footprint for the entire cluster
func (c *carbonCalculator) CalculateClusterCarbon(ctx context.Context, nodes []*corev1.Node, pods []*corev1.Pod) ([]*Metrics, error) {
	now := time.Now()
	var totalCO2 float64
	var totalEnergy float64
	
	// Calculate emissions for each node
	for _, node := range nodes {
		nodeEnergy, err := c.calculateNodeEnergyConsumption(ctx, node, pods)
		if err != nil {
			continue // Skip nodes with calculation errors
		}
		
		totalEnergy += nodeEnergy
	}
	
	// Get grid intensity for the cluster region
	gridIntensity, err := c.gridIntensity.GetGridIntensity(ctx, c.config.DefaultGridIntensity)
	if err != nil {
		gridIntensity = c.config.DefaultGridIntensity
	}
	
	// Apply PUE (Power Usage Effectiveness) to account for datacenter overhead
	totalEnergy *= c.config.PUE
	
	// Calculate CO2 emissions
	totalCO2 = totalEnergy * gridIntensity
	
	return []*Metrics{{
		Timestamp:         now,
		ResourceType:      "cluster",
		ResourceName:      "cluster",
		CO2Emissions:      totalCO2,
		EnergyConsumption: totalEnergy,
		GridIntensity:     gridIntensity,
		Source:           "calculated",
	}}, nil
}

// CalculateNamespaceCarbon calculates carbon footprint for a namespace
func (c *carbonCalculator) CalculateNamespaceCarbon(ctx context.Context, namespace *corev1.Namespace, pods []*corev1.Pod) ([]*Metrics, error) {
	now := time.Now()
	var totalCO2 float64
	var totalEnergy float64
	
	// Filter pods in this namespace
	namespacePods := make([]*corev1.Pod, 0)
	for _, pod := range pods {
		if pod.Namespace == namespace.Name {
			namespacePods = append(namespacePods, pod)
		}
	}
	
	// Calculate energy consumption for all pods in namespace
	for _, pod := range namespacePods {
		podEnergy, err := c.calculatePodEnergyConsumption(ctx, pod)
		if err != nil {
			continue
		}
		totalEnergy += podEnergy
	}
	
	// Get grid intensity
	gridIntensity, err := c.gridIntensity.GetGridIntensity(ctx, c.config.DefaultGridIntensity)
	if err != nil {
		gridIntensity = c.config.DefaultGridIntensity
	}
	
	// Apply PUE
	totalEnergy *= c.config.PUE
	totalCO2 = totalEnergy * gridIntensity
	
	return []*Metrics{{
		Timestamp:         now,
		ResourceType:      "namespace",
		ResourceName:      namespace.Name,
		Namespace:         namespace.Name,
		CO2Emissions:      totalCO2,
		EnergyConsumption: totalEnergy,
		GridIntensity:     gridIntensity,
		Source:           "calculated",
		Labels:           namespace.Labels,
	}}, nil
}

// CalculateNodeCarbon calculates carbon footprint for a node
func (c *carbonCalculator) CalculateNodeCarbon(ctx context.Context, node *corev1.Node, pods []*corev1.Pod) ([]*Metrics, error) {
	now := time.Now()
	
	// Filter pods on this node
	nodePods := make([]*corev1.Pod, 0)
	for _, pod := range pods {
		if pod.Spec.NodeName == node.Name {
			nodePods = append(nodePods, pod)
		}
	}
	
	nodeEnergy, err := c.calculateNodeEnergyConsumption(ctx, node, nodePods)
	if err != nil {
		return nil, err
	}
	
	gridIntensity, err := c.gridIntensity.GetGridIntensity(ctx, c.config.DefaultGridIntensity)
	if err != nil {
		gridIntensity = c.config.DefaultGridIntensity
	}
	
	// Apply PUE
	nodeEnergy *= c.config.PUE
	co2Emissions := nodeEnergy * gridIntensity
	
	// Get instance type from node labels
	instanceType := "unknown"
	if it, ok := node.Labels["beta.kubernetes.io/instance-type"]; ok {
		instanceType = it
	} else if it, ok := node.Labels["node.kubernetes.io/instance-type"]; ok {
		instanceType = it
	}
	
	labels := make(map[string]string)
	labels["instance-type"] = instanceType
	labels["zone"] = node.Labels["topology.kubernetes.io/zone"]
	
	return []*Metrics{{
		Timestamp:         now,
		ResourceType:      "node",
		ResourceName:      node.Name,
		NodeName:          node.Name,
		CO2Emissions:      co2Emissions,
		EnergyConsumption: nodeEnergy,
		GridIntensity:     gridIntensity,
		Source:           "calculated",
		Labels:           labels,
	}}, nil
}

// CalculatePodCarbon calculates carbon footprint for a pod
func (c *carbonCalculator) CalculatePodCarbon(ctx context.Context, pod *corev1.Pod) ([]*Metrics, error) {
	now := time.Now()
	
	podEnergy, err := c.calculatePodEnergyConsumption(ctx, pod)
	if err != nil {
		return nil, err
	}
	
	gridIntensity, err := c.gridIntensity.GetGridIntensity(ctx, c.config.DefaultGridIntensity)
	if err != nil {
		gridIntensity = c.config.DefaultGridIntensity
	}
	
	// Apply PUE
	podEnergy *= c.config.PUE
	co2Emissions := podEnergy * gridIntensity
	
	return []*Metrics{{
		Timestamp:         now,
		ResourceType:      "pod",
		ResourceName:      pod.Name,
		Namespace:         pod.Namespace,
		NodeName:          pod.Spec.NodeName,
		CO2Emissions:      co2Emissions,
		EnergyConsumption: podEnergy,
		GridIntensity:     gridIntensity,
		Source:           "calculated",
		Labels:           pod.Labels,
	}}, nil
}

// calculateNodeEnergyConsumption calculates energy consumption for a node
func (c *carbonCalculator) calculateNodeEnergyConsumption(ctx context.Context, node *corev1.Node, pods []*corev1.Pod) (float64, error) {
	// Get instance specifications
	instanceType := "unknown"
	if it, ok := node.Labels["beta.kubernetes.io/instance-type"]; ok {
		instanceType = it
	} else if it, ok := node.Labels["node.kubernetes.io/instance-type"]; ok {
		instanceType = it
	}
	
	specs, err := c.instanceSpecs.GetInstanceSpecs(instanceType)
	if err != nil {
		// Fallback to default estimation
		specs = &InstanceSpecs{
			InstanceType: instanceType,
			VCPUs:        2,
			MemoryGB:     4,
			TDP:          100, // watts
		}
	}
	
	// Calculate base energy consumption from TDP
	baseEnergyWatts := float64(specs.TDP)
	
	// Calculate utilization-based energy consumption
	totalCPURequests := float64(0)
	totalMemoryRequests := float64(0)
	
	for _, pod := range pods {
		if pod.Spec.NodeName != node.Name {
			continue
		}
		
		for _, container := range pod.Spec.Containers {
			if cpu := container.Resources.Requests.Cpu(); cpu != nil {
				totalCPURequests += float64(cpu.MilliValue())
			}
			if memory := container.Resources.Requests.Memory(); memory != nil {
				totalMemoryRequests += float64(memory.Value())
			}
		}
	}
	
	// Calculate CPU utilization ratio
	nodeCPUCapacity := float64(node.Status.Capacity.Cpu().MilliValue())
	cpuUtilization := totalCPURequests / nodeCPUCapacity
	if cpuUtilization > 1.0 {
		cpuUtilization = 1.0
	}
	
	// Calculate memory utilization ratio
	nodeMemoryCapacity := float64(node.Status.Capacity.Memory().Value())
	memoryUtilization := totalMemoryRequests / nodeMemoryCapacity
	if memoryUtilization > 1.0 {
		memoryUtilization = 1.0
	}
	
	// Use linear scaling based on CPU utilization (simplified model)
	// More sophisticated models would consider CPU scaling factors
	utilizationFactor := 0.3 + (0.7 * cpuUtilization) // Min 30% of TDP, scales to 100%
	energyWatts := baseEnergyWatts * utilizationFactor
	
	// Convert to kWh (assuming 1 hour measurement period)
	energyKWh := energyWatts / 1000.0
	
	return energyKWh, nil
}

// calculatePodEnergyConsumption calculates energy consumption for a pod
func (c *carbonCalculator) calculatePodEnergyConsumption(ctx context.Context, pod *corev1.Pod) (float64, error) {
	// Get the node this pod is running on to understand the instance type
	if pod.Spec.NodeName == "" {
		return 0, fmt.Errorf("pod %s/%s is not scheduled to a node", pod.Namespace, pod.Name)
	}
	
	// Calculate resource requests for the pod
	totalCPURequests := float64(0)
	totalMemoryRequests := float64(0)
	
	for _, container := range pod.Spec.Containers {
		if cpu := container.Resources.Requests.Cpu(); cpu != nil {
			totalCPURequests += float64(cpu.MilliValue())
		}
		if memory := container.Resources.Requests.Memory(); memory != nil {
			totalMemoryRequests += float64(memory.Value())
		}
	}
	
	// Estimate energy based on resource requests
	// This is a simplified model - production systems would use actual utilization metrics
	
	// CPU energy estimation: ~2.5W per 1000 millicores at 100% utilization
	cpuEnergyWatts := (totalCPURequests / 1000.0) * 2.5
	
	// Memory energy estimation: ~0.375W per GB
	memoryEnergyWatts := (totalMemoryRequests / (1024 * 1024 * 1024)) * 0.375
	
	// Total energy consumption
	totalEnergyWatts := cpuEnergyWatts + memoryEnergyWatts
	
	// Convert to kWh (assuming 1 hour measurement period)
	energyKWh := totalEnergyWatts / 1000.0
	
	return energyKWh, nil
}

// ParseQuery parses a JSON query into a Query struct
func ParseQuery(queryJSON []byte) (*Query, error) {
	var query Query
	if err := json.Unmarshal(queryJSON, &query); err != nil {
		return nil, fmt.Errorf("failed to parse query: %w", err)
	}
	return &query, nil
}

// ConvertToDataFrames converts carbon metrics to Grafana data frames
func ConvertToDataFrames(metrics []*Metrics, query *Query) ([]*backend.DataFrame, error) {
	if len(metrics) == 0 {
		return []*backend.DataFrame{}, nil
	}
	
	// Create data frame based on query type
	switch query.QueryType {
	case "timeseries":
		return convertToTimeSeriesFrames(metrics, query)
	case "table":
		return convertToTableFrames(metrics, query)
	case "single-value":
		return convertToSingleValueFrames(metrics, query)
	default:
		return convertToTimeSeriesFrames(metrics, query)
	}
}

// convertToTimeSeriesFrames converts metrics to time series data frames
func convertToTimeSeriesFrames(metrics []*Metrics, query *Query) ([]*backend.DataFrame, error) {
	frame := data.NewFrame(query.RefID)
	
	// Add time field
	timeField := data.NewField("time", nil, make([]time.Time, len(metrics)))
	co2Field := data.NewField("co2_emissions", nil, make([]float64, len(metrics)))
	energyField := data.NewField("energy_consumption", nil, make([]float64, len(metrics)))
	gridIntensityField := data.NewField("grid_intensity", nil, make([]float64, len(metrics)))
	
	// Set units
	co2Field.Config = &data.FieldConfig{Unit: "gCO2"}
	energyField.Config = &data.FieldConfig{Unit: "kWh"}
	gridIntensityField.Config = &data.FieldConfig{Unit: "gCO2/kWh"}
	
	// Fill data
	for i, metric := range metrics {
		timeField.Set(i, metric.Timestamp)
		co2Field.Set(i, metric.CO2Emissions)
		energyField.Set(i, metric.EnergyConsumption)
		gridIntensityField.Set(i, metric.GridIntensity)
	}
	
	frame.Fields = append(frame.Fields, timeField, co2Field, energyField, gridIntensityField)
	
	return []*backend.DataFrame{frame.SetMeta(&data.FrameMeta{
		Type: data.FrameTypeTimeSeriesMulti,
	})}, nil
}

// convertToTableFrames converts metrics to table data frames
func convertToTableFrames(metrics []*Metrics, query *Query) ([]*backend.DataFrame, error) {
	frame := data.NewFrame(query.RefID)
	
	// Add fields for table view
	resourceField := data.NewField("resource", nil, make([]string, len(metrics)))
	namespaceField := data.NewField("namespace", nil, make([]string, len(metrics)))
	co2Field := data.NewField("co2_emissions", nil, make([]float64, len(metrics)))
	energyField := data.NewField("energy_consumption", nil, make([]float64, len(metrics)))
	
	co2Field.Config = &data.FieldConfig{Unit: "gCO2"}
	energyField.Config = &data.FieldConfig{Unit: "kWh"}
	
	for i, metric := range metrics {
		resourceField.Set(i, metric.ResourceName)
		namespaceField.Set(i, metric.Namespace)
		co2Field.Set(i, metric.CO2Emissions)
		energyField.Set(i, metric.EnergyConsumption)
	}
	
	frame.Fields = append(frame.Fields, resourceField, namespaceField, co2Field, energyField)
	
	return []*backend.DataFrame{frame.SetMeta(&data.FrameMeta{
		Type: data.FrameTypeTable,
	})}, nil
}

// convertToSingleValueFrames converts metrics to single value data frames
func convertToSingleValueFrames(metrics []*Metrics, query *Query) ([]*backend.DataFrame, error) {
	// Aggregate metrics based on the specified aggregation method
	var value float64
	
	switch query.Aggregation {
	case "sum":
		for _, metric := range metrics {
			value += metric.CO2Emissions
		}
	case "avg":
		for _, metric := range metrics {
			value += metric.CO2Emissions
		}
		if len(metrics) > 0 {
			value /= float64(len(metrics))
		}
	case "max":
		for i, metric := range metrics {
			if i == 0 || metric.CO2Emissions > value {
				value = metric.CO2Emissions
			}
		}
	case "min":
		for i, metric := range metrics {
			if i == 0 || metric.CO2Emissions < value {
				value = metric.CO2Emissions
			}
		}
	default:
		// Default to sum
		for _, metric := range metrics {
			value += metric.CO2Emissions
		}
	}
	
	frame := data.NewFrame(query.RefID)
	valueField := data.NewField("value", nil, []float64{value})
	valueField.Config = &data.FieldConfig{Unit: "gCO2"}
	
	frame.Fields = append(frame.Fields, valueField)
	
	return []*backend.DataFrame{frame.SetMeta(&data.FrameMeta{
		Type: data.FrameTypeSingleValue,
	})}, nil
}