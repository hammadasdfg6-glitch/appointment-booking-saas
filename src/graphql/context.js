import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const buildGraphQLContext = async ({ req, res }) => {
  let user = null;

  try {
    let token = req.cookies?.token;
    const authHeader = req.headers?.authorization;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded._id) {
        user = await User.findById(decoded._id).select('-passwordHash');
      }
    }
  } catch (err) {
    // Non-blocking: unauthenticated requests simply have user = null
    user = null;
  }

  return {
    user,
    req,
    res,
  };
};
