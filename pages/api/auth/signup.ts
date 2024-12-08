import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import pool from '../../../lib/dt';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    const query = `INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email`;
    const values = [email, hashedPassword];

    const result = await client.query(query, values);
    client.release();

    const user = result.rows[0];
    return res.status(201).json(user);
  } catch (error) {
    console.error('Error signing up:', error);
    return res.status(500).json({ message: 'Failed to create account' });
  }
};
