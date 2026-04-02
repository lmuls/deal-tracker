import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../src/main/resources/openapi/openapi.yaml',
  output: {
    path: 'src/api/generated',
    clean: true,
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      operations: { nesting: 'operationId' },
    },
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: '../client-config.ts',
    },
  ],
});
