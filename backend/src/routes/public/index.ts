import { Router } from 'express';
import { publicGetFileUrlController } from '../../controllers/files.controller';
import { Env } from '../../config/env.config';
import v1Routes from './v1/index';

const publicRoutes = Router();

publicRoutes.use(`${Env.BASE_PATH}/v1`, v1Routes);

publicRoutes.use('/files/:fileId/view', publicGetFileUrlController);

export default publicRoutes;