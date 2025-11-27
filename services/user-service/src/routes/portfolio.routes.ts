import { Router } from 'express';
import { UserDatabaseClient } from '../database.client';
import { CreatePortfolioItemRequest, UpdatePortfolioItemRequest } from '@crypto-monitor/types';

export function createPortfolioRoutes(db: UserDatabaseClient) {
  const router = Router();

  router.get('/:userId', async (req, res) => {
    try {
      const items = await db.getPortfolio(req.params.userId);
      res.json({ success: true, data: items });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const request: CreatePortfolioItemRequest = req.body;
      const item = await db.createPortfolioItem(request);
      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const update: UpdatePortfolioItemRequest = req.body;
      const userId = req.body.userId; // Should come from auth middleware in production
      const item = await db.updatePortfolioItem(req.params.id, userId, update);
      res.json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const userId = req.body.userId; // Should come from auth middleware
      await db.deletePortfolioItem(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  });

  return router;
}
