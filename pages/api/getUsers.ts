import type { NextApiRequest, NextApiResponse } from 'next';
import pool from "../../lib/dt"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { roomId } = req.body;

      const result = await pool.query(
        'SELECT admin, member, monitor FROM rooms WHERE room_id = $1',
        [roomId]
      );

      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Room not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
