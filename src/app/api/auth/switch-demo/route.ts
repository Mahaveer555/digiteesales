import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      department: user.department,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    };

    const token = await createSessionToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
    });

    response.cookies.set('digitee_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Switch demo error:', error);
    return NextResponse.json({ error: 'Failed to switch demo account' }, { status: 500 });
  }
}
