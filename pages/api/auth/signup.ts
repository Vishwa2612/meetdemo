import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import  pool  from '../../../lib/dt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const client = await pool.connect();

      const result = await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email, hashedPassword, role || 'member']
      );

      client.release();

      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
