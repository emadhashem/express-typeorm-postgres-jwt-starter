require('dotenv').config();
import express, { NextFunction, Request, Response } from 'express';
import config from 'config';
import validateEnv from './utils/validateEnv';
import { AppDataSource } from './utils/data-source';
import redisClient from './utils/connectRedis';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRoute from './routes/auth.route'
import userRoute from './routes/user.route'
import AppError from './utils/appError';
AppDataSource.initialize()
  .then(async () => {
    // VALIDATE ENV
    validateEnv();

    const app = express();

    // MIDDLEWARE

    // 1. Body parser
    app.use(express.json({ limit: '10kb' }));

    // 2. Logger
    if (process.env.NODE_ENV === 'development') app.use(morgan("dev"))

    // 3. Cookie Parser
    app.use(cookieParser())
    // 4. Cors
    app.use(cors({ origin: config.get('origin'), credentials : true }))

    // ROUTES
    app.use('/api/auth', authRoute)
    app.use('/api/user', userRoute)

    // HEALTH CHECKER
    app.get('/api/healthchecker', async (_, res: Response) => {
      const message = await redisClient.get('try');
      res.status(200).json({
        status: 'success',
        message,
      });
    });

    // UNHANDLED ROUTE
    app.all('*', (req: Request, res: Response, next: NextFunction) => {
      return next(new AppError(404, `
      Route ${req.originalUrl} not found
      `))
    })
    // GLOBAL ERROR HANDLER
    app.use((err: AppError, _: Request, res: Response, next: NextFunction) => {
      err.status = err.status || 'error'
      err.statusCode = err.statusCode || 500
      res.status(err.statusCode).send({
        status: err.status,
        message: err.message
      })
    })
    const port = config.get<number>('port');
    app.listen(port);

    console.log(`Server started on port: ${port}`);
  })
  .catch((error) => console.log(error));
