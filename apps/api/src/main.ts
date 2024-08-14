import express from 'express';
import * as path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerConfig';

import eventRoutes from './routes/eventRoutes';
import seatRoutes from './routes/seatRoutes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/events', eventRoutes);
app.use('/events', seatRoutes);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/', express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.API_PORT || 4201;
  const server = app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
  });

  server.on('error', console.error);
}

export default app;
