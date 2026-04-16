import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase() }).lean();
    if (!user) {
      // Don't reveal that the email doesn't exist for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.',
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    // In production, send an email here with the reset link.
    // For now, return the token so the frontend can simulate the flow.
    // The reset link would be: `${origin}/reset-password?token=${resetToken}`
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
      // Only return token in development for testing
      ...(process.env.NODE_ENV !== 'production' && { token: resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
