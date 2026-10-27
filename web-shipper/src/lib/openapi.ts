import { createSwaggerSpec } from 'next-swagger-doc';

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.3',
      info: { title: 'GreenPlus Standalone Shipper API', version: '2.0.0' },
      components: {
        securitySchemes: {
          shipperCookie: { type: 'apiKey', in: 'cookie', name: 'gp_shipper_session' },
        },
      },
      security: [{ shipperCookie: [] }],
    },
  });
}
