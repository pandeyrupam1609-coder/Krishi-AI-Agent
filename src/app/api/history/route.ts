import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const history = await db.diagnoses.find({ userId: user.userId });
    return NextResponse.json(history);

  } catch (error) {
    console.error('Error fetching crop health history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve diagnosis history.' },
      { status: 500 }
    );
  }
}
