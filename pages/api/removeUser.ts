import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/dt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { roomId, email, role } = req.body;

    if (!roomId || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      await pool.query(
        `UPDATE rooms SET ${role} = array_remove(${role}, $1) WHERE room_id = $2`,
        [email, roomId]
      );
      return res.status(200).json({ message: 'User removed' });
    } catch (error) {
      console.error('Error removing user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
