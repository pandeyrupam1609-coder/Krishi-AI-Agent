import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, state, farmSize, cropTypes } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required fields.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the user record
    const user = await db.users.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      state,
      farmSize,
      cropTypes: cropTypes || []
    });

    // Generate JWT auth token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name
    });

    // Create a system welcome notification for this user
    await db.notifications.create({
      userId: user.id,
      title: 'Welcome to Krishi AI Agent!',
      message: `Hello ${name}, welcome! You can use the Disease Detector to scan crops, or ask our chatbot Krishi Mitra any farming questions.`,
      type: 'system',
      isRead: false
    });

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        state: user.state,
        farmSize: user.farmSize,
        cropTypes: user.cropTypes
      }
    });

  } catch (error: any) {
    console.error('Error during registration endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
