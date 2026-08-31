import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';

export const tagRouter = Router();

tagRouter.get('/', tagController.list);
