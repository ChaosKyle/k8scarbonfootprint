package carbon

import (
	"context"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestCarbonCalculator(t *testing.T) {
	config := &CarbonConfig{
		DefaultGridIntensity:    500.0, // gCO2/kWh
		PUE:                    1.5,
		EnableNetworkAccounting: true,
		EnableStorageAccounting: true,
	}

	calculator := NewCarbonCalculator(config)
	ctx := context.Background()

	t.Run("CalculateClusterCarbon", func(t *testing.T) {
		nodes := createTestNodes()
		pods := createTestPods()

		metrics, err := calculator.CalculateClusterCarbon(ctx, nodes, pods)
		if err != nil {
			t.Fatalf("CalculateClusterCarbon failed: %v", err)
		}

		if len(metrics) != 1 {
			t.Errorf("Expected 1 metric, got %d", len(metrics))
		}

		metric := metrics[0]
		if metric.ResourceType != "cluster" {
			t.Errorf("Expected resource type 'cluster', got %s", metric.ResourceType)
		}

		if metric.CO2Emissions <= 0 {
			t.Errorf("Expected positive CO2 emissions, got %f", metric.CO2Emissions)
		}

		if metric.EnergyConsumption <= 0 {
			t.Errorf("Expected positive energy consumption, got %f", metric.EnergyConsumption)
		}

		if metric.GridIntensity != config.DefaultGridIntensity {
			t.Errorf("Expected grid intensity %f, got %f", config.DefaultGridIntensity, metric.GridIntensity)
		}
	})

	t.Run("CalculateNamespaceCarbon", func(t *testing.T) {
		namespace := &corev1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: "test-namespace",
				Labels: map[string]string{
					"environment": "test",
				},
			},
		}
		pods := createTestPods()

		metrics, err := calculator.CalculateNamespaceCarbon(ctx, namespace, pods)
		if err != nil {
			t.Fatalf("CalculateNamespaceCarbon failed: %v", err)
		}

		if len(metrics) != 1 {
			t.Errorf("Expected 1 metric, got %d", len(metrics))
		}

		metric := metrics[0]
		if metric.ResourceType != "namespace" {
			t.Errorf("Expected resource type 'namespace', got %s", metric.ResourceType)
		}

		if metric.Namespace != "test-namespace" {
			t.Errorf("Expected namespace 'test-namespace', got %s", metric.Namespace)
		}

		if metric.Labels["environment"] != "test" {
			t.Errorf("Expected environment label 'test', got %s", metric.Labels["environment"])
		}
	})

	t.Run("CalculateNodeCarbon", func(t *testing.T) {
		node := createTestNodes()[0]
		pods := createTestPods()

		metrics, err := calculator.CalculateNodeCarbon(ctx, node, pods)
		if err != nil {
			t.Fatalf("CalculateNodeCarbon failed: %v", err)
		}

		if len(metrics) != 1 {
			t.Errorf("Expected 1 metric, got %d", len(metrics))
		}

		metric := metrics[0]
		if metric.ResourceType != "node" {
			t.Errorf("Expected resource type 'node', got %s", metric.ResourceType)
		}

		if metric.NodeName != node.Name {
			t.Errorf("Expected node name %s, got %s", node.Name, metric.NodeName)
		}

		if metric.Labels["instance-type"] != "m5.large" {
			t.Errorf("Expected instance type 'm5.large', got %s", metric.Labels["instance-type"])
		}
	})

	t.Run("CalculatePodCarbon", func(t *testing.T) {
		pod := createTestPods()[0]

		metrics, err := calculator.CalculatePodCarbon(ctx, pod)
		if err != nil {
			t.Fatalf("CalculatePodCarbon failed: %v", err)
		}

		if len(metrics) != 1 {
			t.Errorf("Expected 1 metric, got %d", len(metrics))
		}

		metric := metrics[0]
		if metric.ResourceType != "pod" {
			t.Errorf("Expected resource type 'pod', got %s", metric.ResourceType)
		}

		if metric.ResourceName != pod.Name {
			t.Errorf("Expected resource name %s, got %s", pod.Name, metric.ResourceName)
		}

		if metric.Namespace != pod.Namespace {
			t.Errorf("Expected namespace %s, got %s", pod.Namespace, metric.Namespace)
		}

		if metric.NodeName != pod.Spec.NodeName {
			t.Errorf("Expected node name %s, got %s", pod.Spec.NodeName, metric.NodeName)
		}
	})

	t.Run("EnergyCalculationAccuracy", func(t *testing.T) {
		// Test with different resource configurations
		pods := []*corev1.Pod{
			createPodWithResources("high-cpu-pod", "test", "1000m", "1Gi"),
			createPodWithResources("low-cpu-pod", "test", "100m", "256Mi"),
		}

		highCPUMetrics, err := calculator.CalculatePodCarbon(ctx, pods[0])
		if err != nil {
			t.Fatalf("Failed to calculate high CPU pod carbon: %v", err)
		}

		lowCPUMetrics, err := calculator.CalculatePodCarbon(ctx, pods[1])
		if err != nil {
			t.Fatalf("Failed to calculate low CPU pod carbon: %v", err)
		}

		// High CPU pod should consume more energy
		if highCPUMetrics[0].EnergyConsumption <= lowCPUMetrics[0].EnergyConsumption {
			t.Errorf("High CPU pod should consume more energy: %f vs %f",
				highCPUMetrics[0].EnergyConsumption, lowCPUMetrics[0].EnergyConsumption)
		}

		// High CPU pod should emit more CO2
		if highCPUMetrics[0].CO2Emissions <= lowCPUMetrics[0].CO2Emissions {
			t.Errorf("High CPU pod should emit more CO2: %f vs %f",
				highCPUMetrics[0].CO2Emissions, lowCPUMetrics[0].CO2Emissions)
		}
	})

	t.Run("PUEApplication", func(t *testing.T) {
		// Test that PUE is correctly applied
		pod := createTestPods()[0]
		
		// Calculate with default PUE (1.5)
		metrics, err := calculator.CalculatePodCarbon(ctx, pod)
		if err != nil {
			t.Fatalf("Failed to calculate pod carbon: %v", err)
		}

		baseEnergy := metrics[0].EnergyConsumption

		// Create calculator with different PUE
		configNoPUE := &CarbonConfig{
			DefaultGridIntensity: 500.0,
			PUE:                 1.0, // No datacenter overhead
		}
		calculatorNoPUE := NewCarbonCalculator(configNoPUE)

		metricsNoPUE, err := calculatorNoPUE.CalculatePodCarbon(ctx, pod)
		if err != nil {
			t.Fatalf("Failed to calculate pod carbon with no PUE: %v", err)
		}

		// Energy with PUE should be higher
		if baseEnergy <= metricsNoPUE[0].EnergyConsumption {
			t.Errorf("PUE should increase energy consumption: %f vs %f",
				baseEnergy, metricsNoPUE[0].EnergyConsumption)
		}

		// Should be exactly 1.5x higher
		expectedEnergy := metricsNoPUE[0].EnergyConsumption * 1.5
		tolerance := 0.001
		if abs(baseEnergy-expectedEnergy) > tolerance {
			t.Errorf("PUE multiplication incorrect: expected %f, got %f",
				expectedEnergy, baseEnergy)
		}
	})

	t.Run("ErrorHandling", func(t *testing.T) {
		// Test with pod not scheduled to a node
		unscheduledPod := &corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:      "unscheduled-pod",
				Namespace: "test",
			},
			Spec: corev1.PodSpec{
				NodeName: "", // Not scheduled
			},
		}

		_, err := calculator.CalculatePodCarbon(ctx, unscheduledPod)
		if err == nil {
			t.Error("Expected error for unscheduled pod, got nil")
		}
	})

	t.Run("ThreadSafety", func(t *testing.T) {
		// Test concurrent access to calculator
		pod := createTestPods()[0]
		
		done := make(chan bool, 10)
		for i := 0; i < 10; i++ {
			go func() {
				defer func() { done <- true }()
				
				_, err := calculator.CalculatePodCarbon(ctx, pod)
				if err != nil {
					t.Errorf("Concurrent calculation failed: %v", err)
				}
			}()
		}

		// Wait for all goroutines to complete
		for i := 0; i < 10; i++ {
			<-done
		}
	})
}

func TestParseQuery(t *testing.T) {
	t.Run("ValidQuery", func(t *testing.T) {
		queryJSON := []byte(`{
			"refId": "A",
			"queryType": "timeseries",
			"resourceType": "cluster",
			"aggregation": "sum",
			"groupBy": ["namespace"],
			"filters": {"namespace": "production"},
			"timeRange": {
				"from": "2023-01-01T00:00:00Z",
				"to": "2023-01-02T00:00:00Z"
			}
		}`)

		query, err := ParseQuery(queryJSON)
		if err != nil {
			t.Fatalf("ParseQuery failed: %v", err)
		}

		if query.RefID != "A" {
			t.Errorf("Expected RefID 'A', got %s", query.RefID)
		}

		if query.QueryType != "timeseries" {
			t.Errorf("Expected QueryType 'timeseries', got %s", query.QueryType)
		}

		if query.ResourceType != "cluster" {
			t.Errorf("Expected ResourceType 'cluster', got %s", query.ResourceType)
		}

		if query.Aggregation != "sum" {
			t.Errorf("Expected Aggregation 'sum', got %s", query.Aggregation)
		}

		if len(query.GroupBy) != 1 || query.GroupBy[0] != "namespace" {
			t.Errorf("Expected GroupBy ['namespace'], got %v", query.GroupBy)
		}

		if query.Filters["namespace"] != "production" {
			t.Errorf("Expected filter namespace 'production', got %v", query.Filters["namespace"])
		}
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		queryJSON := []byte(`{invalid json}`)

		_, err := ParseQuery(queryJSON)
		if err == nil {
			t.Error("Expected error for invalid JSON, got nil")
		}
	})
}

func TestConvertToDataFrames(t *testing.T) {
	now := time.Now()
	metrics := []*Metrics{
		{
			Timestamp:         now.Add(-2 * time.Minute),
			ResourceType:      "pod",
			ResourceName:      "test-pod-1",
			Namespace:         "production",
			CO2Emissions:      100.5,
			EnergyConsumption: 0.2,
			GridIntensity:     500,
			Source:           "calculated",
		},
		{
			Timestamp:         now.Add(-1 * time.Minute),
			ResourceType:      "pod",
			ResourceName:      "test-pod-1",
			Namespace:         "production",
			CO2Emissions:      105.2,
			EnergyConsumption: 0.21,
			GridIntensity:     502,
			Source:           "calculated",
		},
	}

	t.Run("TimeSeriesFrames", func(t *testing.T) {
		query := &Query{
			RefID:     "A",
			QueryType: "timeseries",
		}

		frames, err := ConvertToDataFrames(metrics, query)
		if err != nil {
			t.Fatalf("ConvertToDataFrames failed: %v", err)
		}

		if len(frames) != 1 {
			t.Errorf("Expected 1 frame, got %d", len(frames))
		}

		frame := frames[0]
		if len(frame.Fields) != 4 {
			t.Errorf("Expected 4 fields, got %d", len(frame.Fields))
		}

		// Check field names
		expectedFields := []string{"time", "co2_emissions", "energy_consumption", "grid_intensity"}
		for i, field := range frame.Fields {
			if field.Name != expectedFields[i] {
				t.Errorf("Expected field name %s, got %s", expectedFields[i], field.Name)
			}
		}

		// Check data length
		if frame.Fields[0].Len() != 2 {
			t.Errorf("Expected 2 data points, got %d", frame.Fields[0].Len())
		}
	})

	t.Run("TableFrames", func(t *testing.T) {
		query := &Query{
			RefID:     "B",
			QueryType: "table",
		}

		frames, err := ConvertToDataFrames(metrics, query)
		if err != nil {
			t.Fatalf("ConvertToDataFrames failed: %v", err)
		}

		if len(frames) != 1 {
			t.Errorf("Expected 1 frame, got %d", len(frames))
		}

		frame := frames[0]
		if len(frame.Fields) != 4 {
			t.Errorf("Expected 4 fields, got %d", len(frame.Fields))
		}

		// Check field names for table
		expectedFields := []string{"resource", "namespace", "co2_emissions", "energy_consumption"}
		for i, field := range frame.Fields {
			if field.Name != expectedFields[i] {
				t.Errorf("Expected field name %s, got %s", expectedFields[i], field.Name)
			}
		}
	})

	t.Run("SingleValueFrames", func(t *testing.T) {
		query := &Query{
			RefID:       "C",
			QueryType:   "single-value",
			Aggregation: "sum",
		}

		frames, err := ConvertToDataFrames(metrics, query)
		if err != nil {
			t.Fatalf("ConvertToDataFrames failed: %v", err)
		}

		if len(frames) != 1 {
			t.Errorf("Expected 1 frame, got %d", len(frames))
		}

		frame := frames[0]
		if len(frame.Fields) != 1 {
			t.Errorf("Expected 1 field, got %d", len(frame.Fields))
		}

		if frame.Fields[0].Name != "value" {
			t.Errorf("Expected field name 'value', got %s", frame.Fields[0].Name)
		}

		// Check that sum aggregation worked
		expectedSum := 100.5 + 105.2
		actualValue := frame.Fields[0].At(0).(float64)
		if abs(actualValue-expectedSum) > 0.1 {
			t.Errorf("Expected sum %f, got %f", expectedSum, actualValue)
		}
	})

	t.Run("EmptyMetrics", func(t *testing.T) {
		query := &Query{RefID: "D", QueryType: "timeseries"}
		
		frames, err := ConvertToDataFrames([]*Metrics{}, query)
		if err != nil {
			t.Fatalf("ConvertToDataFrames failed: %v", err)
		}

		if len(frames) != 0 {
			t.Errorf("Expected 0 frames for empty metrics, got %d", len(frames))
		}
	})
}

// Helper functions for tests

func createTestNodes() []*corev1.Node {
	return []*corev1.Node{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name: "test-node-1",
				Labels: map[string]string{
					"beta.kubernetes.io/instance-type": "m5.large",
					"topology.kubernetes.io/zone":       "us-west-2a",
				},
			},
			Status: corev1.NodeStatus{
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse("2"),
					corev1.ResourceMemory: resource.MustParse("8Gi"),
				},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name: "test-node-2",
				Labels: map[string]string{
					"beta.kubernetes.io/instance-type": "m5.xlarge",
					"topology.kubernetes.io/zone":       "us-west-2b",
				},
			},
			Status: corev1.NodeStatus{
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse("4"),
					corev1.ResourceMemory: resource.MustParse("16Gi"),
				},
			},
		},
	}
}

func createTestPods() []*corev1.Pod {
	return []*corev1.Pod{
		createPodWithResources("test-pod-1", "production", "500m", "1Gi"),
		createPodWithResources("test-pod-2", "production", "250m", "512Mi"),
		createPodWithResources("test-pod-3", "development", "100m", "256Mi"),
	}
}

func createPodWithResources(name, namespace, cpu, memory string) *corev1.Pod {
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			Labels: map[string]string{
				"app": "test-app",
			},
		},
		Spec: corev1.PodSpec{
			NodeName: "test-node-1",
			Containers: []corev1.Container{
				{
					Name: "test-container",
					Resources: corev1.ResourceRequirements{
						Requests: corev1.ResourceList{
							corev1.ResourceCPU:    resource.MustParse(cpu),
							corev1.ResourceMemory: resource.MustParse(memory),
						},
					},
				},
			},
		},
	}
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}