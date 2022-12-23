const schemas = require('./schemas');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require("swagger-ui-express");
const {NODE_ENV, PORT, WEBSITE_API} = process.env;

module.exports = v2Doc = ({app}) => {
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      version: '2.0.0',
      contact: {
        name: 'Ajiboye Adedotun G.',
        email: 'ajiboyeadedotun16@gmai.com',
        url: 'https://github.com/youngprinnce'
      },
      title: 'template - Book Escorts - API',
      description: 'template NG Server/Backend - API with email sign-up, verification, authentication,forgot password, bookings, SMS messaging, Email messaging, Review and so much more.',
    },
    servers: [
      NODE_ENV === 'development' ? {
        url: `http://localhost:${PORT}`,
        description: 'template Localhost/Development Server'
      } : {
        url: 'https://staging.api.template.ng',
        description: 'template Staging/Development Server'
      },
      {
        url: WEBSITE_API,
        description: 'template Production Server'
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          name: 'accessToken',
          bearerFormat: 'JWT',
          in: 'cookie',
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid, or the user does not have access to perform the action',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: "Unauthorized access"
                  }
                }
              }
            }
          },
        },
        NotFoundError: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: "Not found"
                  }
                }
              }
            }
          },
        },
      },
      schemas,
    },
    tags: [
      {
        name: 'Auth',
        description: 'Auth routes'
      },
      {
        name: 'Users',
        description: 'Users routes'
      },
      {
        name: 'Notifications',
        description: 'Notifications routes'
      },
      {
        name: 'Banks',
        description: 'Banks routes'
      },
    ],
  };

  const options = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "template - API Documentation v1",
    customfavIcon: "/assets/template-ng-solid.png",
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          url: '/v1/get-laid',
          name: 'v1'
        },
      ]
    }
  };
  const swaggerDoc = swaggerJSDoc({swaggerDefinition, apis: ['./api/v1/components/**/*.yml']});

  app.use('/v1/get-laid', swaggerUi.serveFiles(swaggerDoc, null), swaggerUi.setup(swaggerDoc, options));
};
