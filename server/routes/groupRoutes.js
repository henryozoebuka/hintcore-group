import express from 'express';
import { createGroup } from '../controllers/groupControllers.js';

const groupRouter = express.Router();

groupRouter.post('/public/create-group', createGroup);

export default groupRouter;