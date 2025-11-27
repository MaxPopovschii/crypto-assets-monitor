import { Router } from 'express';
import { UserDatabaseClient } from '../database.client';

export function createWatchlistRoutes(db: UserDatabaseClient) {
  const router = Router();

  router.post('/:userId/:tokenSymbol', async (req, res) => {
    try {
      await db.addToWatchlist(req.params.userId, req.params.tokenSymbol);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  });

  router.delete('/:userId/:tokenSymbol', async (req, res) => {
    try {
      await db.removeFromWatchlist(req.params.userId, req.params.tokenSymbol);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  });

  router.get('/:userId', async (req, res) => {
    try {
      const symbols = await db.getWatchlist(req.params.userId);
      res.json({ success: true, data: symbols });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  });

  return router;
}
