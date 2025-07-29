# k8scarbonfootprint

A Grafana plugin for monitoring Kubernetes carbon footprint on cloud providers.

## Overview

The k8scarbonfootprint plugin provides comprehensive visualization and monitoring of CO2 emissions from Kubernetes workloads running on AWS EKS, Azure AKS, and Google Cloud GKE. It integrates with existing Grafana infrastructure to deliver actionable insights for sustainable cloud operations.

## Features

- **Multi-Cloud Support**: Monitor carbon footprint across AWS, Azure, and Google Cloud
- **Kubernetes Integration**: Deep integration with K8s APIs and Prometheus metrics
- **Executive & Technical Dashboards**: High-level business impact and detailed engineering insights
- **Real-time Calculations**: Industry-standard CO2 calculations using live grid intensity data
- **Optimization Recommendations**: Actionable suggestions for reducing carbon footprint
- **Secure by Design**: Built with DevSecOps best practices and security scanning

## Quick Start

### Prerequisites

- Grafana 10.0 or later
- Access to Kubernetes clusters (AWS EKS, Azure AKS, or Google Cloud GKE)
- Appropriate cloud provider permissions for metrics access

### Installation

1. **From Grafana Catalog** (Recommended):
   - Navigate to Configuration > Plugins in your Grafana instance
   - Search for "k8scarbonfootprint"
   - Click Install

2. **Manual Installation**:
   ```bash
   # Download the latest release
   wget https://github.com/ChaosKyle/k8scarbonfootprint/releases/latest/download/k8scarbonfootprint.zip
   
   # Extract to Grafana plugins directory
   unzip k8scarbonfootprint.zip -d /var/lib/grafana/plugins/
   
   # Restart Grafana
   sudo systemctl restart grafana-server
   ```

### Configuration

1. Enable the plugin in Grafana settings
2. Configure data sources for your Kubernetes clusters
3. Set up cloud provider credentials (stored securely using Grafana's encrypted storage)
4. Import pre-built dashboards from the plugin catalog

## Development

### Prerequisites

- Go 1.21+
- Node.js 18+
- Docker (for testing)
- kubectl (for Kubernetes access)

### Local Development

```bash
# Clone the repository
git clone https://github.com/ChaosKyle/k8scarbonfootprint.git
cd k8scarbonfootprint

# Install dependencies
npm install
go mod download

# Build the plugin
npm run build

# Run tests
npm test
go test ./...

# Start development server
npm run dev
```

## Architecture

The plugin consists of three main components:

1. **Data Source Plugin**: Collects metrics from Kubernetes APIs and cloud providers
2. **Panel Plugins**: Custom visualizations for carbon footprint data
3. **App Plugin**: Orchestrates the complete experience with pre-built dashboards

## Security

This project follows DevSecOps best practices:

- All dependencies are scanned for vulnerabilities
- API credentials are encrypted using Grafana's secure storage
- Container images are scanned with security tools
- RBAC integration for Kubernetes access
- Regular security audits and updates

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://github.com/ChaosKyle/k8scarbonfootprint/wiki)
- [Issue Tracker](https://github.com/ChaosKyle/k8scarbonfootprint/issues)
- [Discussions](https://github.com/ChaosKyle/k8scarbonfootprint/discussions)
