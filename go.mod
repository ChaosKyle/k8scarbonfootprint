module github.com/ChaosKyle/k8scarbonfootprint

go 1.21

require (
	github.com/grafana/grafana-plugin-sdk-go v0.180.0
	k8s.io/api v0.28.4
	k8s.io/apimachinery v0.28.4
	k8s.io/client-go v0.28.4
	github.com/prometheus/client_golang v1.17.0
)

require (
	cloud.google.com/go/compute v1.23.0
	github.com/aws/aws-sdk-go-v2 v1.21.0
	github.com/aws/aws-sdk-go-v2/config v1.18.45
	github.com/aws/aws-sdk-go-v2/service/cloudwatch v1.27.8
	github.com/Azure/azure-sdk-for-go/sdk/azcore v1.8.0
	github.com/Azure/azure-sdk-for-go/sdk/azidentity v1.4.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/monitor v0.11.0
)