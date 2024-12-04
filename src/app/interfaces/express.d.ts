import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        role: string;
        email: string;
      } & JwtPayload;
    }
  }
} 