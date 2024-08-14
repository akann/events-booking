import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Seat Reservation API',
      version: '1.0.0',
      description: 'API documentation for the Seat Reservation system',
    },
    servers: [
      {
        url: `http://localhost:${process.env.API_PORT || 4201}`,
        description: 'Events server',
      },
    ],
  },

  apis: ['./apps/api/src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
