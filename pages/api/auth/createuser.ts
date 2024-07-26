import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/dt'; 
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      const result = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email, hashedPassword, role]
      );
      const newUser = result.rows[0];
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Error creating user' });
    } finally {
      client.release();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
