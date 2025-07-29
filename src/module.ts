import { AppPlugin } from '@grafana/data';
import { AppConfig } from './types';
import { AppRootProps } from '@grafana/data';
import { CarbonFootprintApp } from './components/CarbonFootprintApp';

export class K8sCarbonFootprintApp extends AppPlugin<AppConfig> {
  constructor() {
    super();
    
    // Set the root component
    this.root = CarbonFootprintApp;
    
    // Configure the app
    this.configureApp();
  }

  private configureApp() {
    // Add navigation items
    this.addConfigPage({
      title: 'Configuration',
      icon: 'cog',
      body: () => import('./components/ConfigPage'),
      id: 'configuration',
    });

    this.addConfigPage({
      title: 'Data Sources',
      icon: 'database',
      body: () => import('./components/DataSourcesPage'),
      id: 'datasources',
    });

    this.addConfigPage({
      title: 'Dashboards',
      icon: 'apps',
      body: () => import('./components/DashboardsPage'),
      id: 'dashboards',
    });
  }
}

export const plugin = new K8sCarbonFootprintApp();