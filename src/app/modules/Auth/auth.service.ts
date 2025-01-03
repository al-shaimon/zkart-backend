import prisma from '../../../shared/prisma';
import * as bcrypt from 'bcrypt';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import { UserStatus } from '@prisma/client';
import config from '../../../config';
import { Secret } from 'jsonwebtoken';
import emailSender from './emailSender';
import ApiError from '../../errors/ApiError';

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  const isCorrectPassword = await bcrypt.compare(payload.password, userData.password);

  if (!isCorrectPassword) {
    throw new Error('Password incorrect!');
  }

  const accessToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret);
  } catch (err) {
    throw new Error('You are not authorized!');
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: decodedData?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
  };
};

const changePassword = async (user: any, payload: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const isCorrectPassword = await bcrypt.compare(payload.oldPassword, userData.password);

  if (!isCorrectPassword) {
    throw new Error('Password incorrect!');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'Password changed successfully!',
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  const resetPassToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );

  const resetPassLink = config.reset_pass_link + `?email=${userData.email}&token=${resetPassToken}`;

  await emailSender(
    userData.email,
    `
    <div>
        <p>Dear User,</p>
        <p>Your password reset link 
            <a href=${resetPassLink}>
                <button>
                    Reset Password
                </button>
            </a>
        </p>

    </div>
    `,
    'Reset Your Password'
  );

  // console.log(resetPassLink);
};

const resetPassword = async (
  token: string,
  payload: {
    email: string;
    password: string;
  }
) => {
  // Verify token first
  const isValidToken = jwtHelpers.verifyToken(token, config.jwt.reset_pass_secret as Secret);

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invalid or expired token');
  }

  // Find user by email
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  // Hash password
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // Update password
  await prisma.user.update({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
    data: {
      password: hashedPassword,
    },
  });
};

export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};
