import type { OpenNextConfig } from '@opennextjs/aws';

const config: OpenNextConfig = {
  default: {},
  buildCommand: 'npm run build',
  packageJsonPath: './package.json',
};

export default config;
