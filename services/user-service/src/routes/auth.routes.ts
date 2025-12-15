import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserDatabaseClient } from '../database.client';
import { CreateUserRequest, LoginRequest } from '@crypto-monitor/types';

export function createAuthRoutes(db: UserDatabaseClient, jwtConfig: { secret: string; expiresIn: string }) {
  const router = Router();

  router.post('/register', async (req, res) => {
    try {
      const request: CreateUserRequest = req.body;
      const user = await db.createUser(request);
      const token = jwt.sign({ userId: user.id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);
      
      res.status(201).json({ success: true, data: { user, token } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password }: LoginRequest = req.body;
      const user = await db.findUserByEmail(email);
      
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ success: false, error: { message: 'Invalid credentials' } });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      const token = jwt.sign({ userId: user.id }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);
      
      res.json({ success: true, data: { user: userWithoutPassword, token } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  });

  return router;
}
