import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'vibetogether',
  brand: {
    displayName: '같이바코할사람',
    primaryColor: '#ae49fd',
    icon: '/appsintoss-logo.png',
  },
  web: {
    host: '192.168.45.172',
    port: 5183,
    commands: {
      dev: 'npm run dev:ait -- --host',
      build: 'npm run build:ait',
    },
  },
  permissions: [],
  outdir: 'dist',
});
