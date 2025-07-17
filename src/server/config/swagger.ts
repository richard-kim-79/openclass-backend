import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OpenClass API',
      version: '1.0.0',
      description: 'OpenClass 온라인 강의실 플랫폼 API 문서',
      contact: {
        name: 'OpenClass 개발팀',
        email: 'dev@openclass.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/server/routes/*.ts',
    './src/server/controllers/*.ts',
    './src/server/types/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs }; 