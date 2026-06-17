import 'dotenv/config';
import './config/passport.config';
import express, { Request, Response } from 'express';
import passport from 'passport';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { Env } from './config/env.config';
import { UnauthorizedException } from './utils/app-error';
import { asyncHandler } from './middlewares/async-handler.middleware';
import { errorHandler } from './middlewares/error-handler.middlewarte';
import { HTTPSTATUS } from './config/http.config';
import { logger } from './utils/logger';
// import { logTail } from './config/logtail.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';
import internalRoutes from './routes/internal';
import publicRoutes from './routes/public';

const app = express();

const allowedOrigins = Env.ALLOWED_ORIGINS?.split(',');

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const errorMsg = `CORS error: Origin ${origin} is not allowed`;
      callback(new UnauthorizedException(errorMsg), false);
    }
  },
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
// Content-Security-Policy:script-src 'self' --> Only run JavaScript files from THIS website.

app.use(passport.initialize());

app.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: 'Hello Welcome to Express',
    });
  }),
);

app.use(`${Env.BASE_PATH}`, internalRoutes);
app.use(publicRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();
    const server = app.listen(Env.PORT, () => {
      logger.info(
        `Server listening on port ${Env.PORT} in ${Env.NODE_ENV} mode`,
      );
    });

    const shutdownSignals : NodeJS.Signals[] = ['SIGTERM', 'SIGINT']; // signal interupt, signal terminate

    shutdownSignals.forEach((signal) => {
      process.on(signal, async () => {
        logger.warn(`${signal} recieved: shutting down gracefully`);

        try {
          server.close(() => {
            logger.warn('HTTP server closed');
          });
          //disconnect db
          await disconnectDatabase();

        //   await logTail.flush();

          process.exit(0);
        } catch (error) {
          logger.error(`Error occured during shutting down`, error);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    logger.error(`Failed to start server`, error);
    process.exit(1);
  }
}

startServer();