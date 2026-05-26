import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_please_change_in_production';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId, employeeId: user.employeeId },
    SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};
