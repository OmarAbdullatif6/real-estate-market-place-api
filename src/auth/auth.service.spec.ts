import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/users.model';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { RegisterUserRole } from './dtos/register.dto';
import { UserRole } from '../types/userRole.type';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;
  let mockMailService: any;
  let mockConfigService: any;
  let mockOAuth2Client: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockImplementation((payload) => {
        if (payload.email) return Promise.resolve('mock-access-token');
        return Promise.resolve('mock-refresh-token');
      }),
      verifyAsync: jest.fn(),
    };

    mockMailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'GOOGLE_CLIENT_ID':
            return 'google-client-id-123';
          case 'JWT_SECRET_KEY':
            return 'access-secret';
          case 'JWT_EXPIRES_IN':
            return '1d';
          case 'JWT_REFRESH_SECRET_KEY':
            return 'refresh-secret';
          case 'JWT_REFRESH_EXPIRES_IN':
            return '7d';
          case 'FRONTEND_URL':
            return 'http://localhost:3000';
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Mock OAuth2Client instance on the service
    mockOAuth2Client = {
      verifyIdToken: jest.fn(),
    };
    (service as any).googleClient = mockOAuth2Client;
  });

  describe('register', () => {
    it('should register a new user, map userRole to role, and exclude password from response', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const createdDoc = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phoneNumber: '1234567890',
        role: UserRole.SELLER,
        password: '$2a$10$hashedpassword',
        toObject: function () {
          return {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            phoneNumber: this.phoneNumber,
            role: this.role,
            password: this.password,
          };
        },
      };

      mockUserModel.create.mockResolvedValue(createdDoc);
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.register({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890',
        userRole: RegisterUserRole.SELLER,
      });

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: RegisterUserRole.SELLER,
        }),
      );
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
      expect(result.user.email).toBe('jane@example.com');
      expect(result.user.role).toBe(UserRole.SELLER);
      expect(result.user.id).toBe('507f1f77bcf86cd799439011');
      expect(result.user.name).toBe('Jane Doe');
    });

    it('should throw BadRequestException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ email: 'jane@example.com' });

      await expect(
        service.register({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
          phoneNumber: '1234567890',
          userRole: RegisterUserRole.BUYER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on duplicate phone number', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.register({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
          phoneNumber: '1234567890',
          userRole: RegisterUserRole.BUYER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully log in and exclude password from response', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const userDoc = {
        _id: '507f1f77bcf86cd799439011',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        role: UserRole.BUYER,
        password: hashedPassword,
        toObject: function () {
          return {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            role: this.role,
            password: this.password,
          };
        },
      };

      const selectMock = jest.fn().mockResolvedValue(userDoc);
      mockUserModel.findOne.mockReturnValue({ select: selectMock });
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.login({
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
      expect(result.user.email).toBe('jane@example.com');
    });

    it('should reject invalid password', async () => {
      const hashedPassword = await bcrypt.hash('OtherPassword123!', 10);
      const userDoc = {
        email: 'jane@example.com',
        password: hashedPassword,
      };

      const selectMock = jest.fn().mockResolvedValue(userDoc);
      mockUserModel.findOne.mockReturnValue({ select: selectMock });

      await expect(
        service.login({
          email: 'jane@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject password login when user has no password (e.g. Google user)', async () => {
      const userDoc = {
        email: 'google@example.com',
        password: null,
      };

      const selectMock = jest.fn().mockResolvedValue(userDoc);
      mockUserModel.findOne.mockReturnValue({ select: selectMock });

      await expect(
        service.login({
          email: 'google@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleAuth', () => {
    it('should authenticate a new Google user using payload.sub as googleId', async () => {
      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-unique-sub-id-999',
          email: 'googleuser@gmail.com',
          name: 'Google User',
        }),
      });

      mockUserModel.findOne.mockResolvedValue(null);

      const createdUser = {
        _id: '507f1f77bcf86cd799439099',
        fullName: 'Google User',
        email: 'googleuser@gmail.com',
        googleId: 'google-unique-sub-id-999',
        role: UserRole.BUYER,
        toObject: function () {
          return {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            googleId: this.googleId,
            role: this.role,
          };
        },
      };

      mockUserModel.create.mockResolvedValue(createdUser);
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.googleAuth('valid-google-id-token');

      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-google-id-token',
        audience: 'google-client-id-123',
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [{ googleId: 'google-unique-sub-id-999' }, { email: 'googleuser@gmail.com' }],
      });

      expect(mockUserModel.create).toHaveBeenCalledWith({
        fullName: 'Google User',
        email: 'googleuser@gmail.com',
        googleId: 'google-unique-sub-id-999',
      });

      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
      expect(result.user.googleId).toBe('google-unique-sub-id-999');
      expect(result.user.email).toBe('googleuser@gmail.com');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('should link existing user by email when googleId was not set', async () => {
      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-sub-777',
          email: 'existing@example.com',
          name: 'Existing User',
        }),
      });

      const existingUser = {
        _id: '507f1f77bcf86cd799439077',
        fullName: 'Existing User',
        email: 'existing@example.com',
        googleId: null,
        role: UserRole.BUYER,
        save: jest.fn().mockResolvedValue(true),
        toObject: function () {
          return {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            googleId: this.googleId,
            role: this.role,
          };
        },
      };

      mockUserModel.findOne.mockResolvedValue(existingUser);
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.googleAuth('valid-google-id-token');

      expect(existingUser.googleId).toBe('google-sub-777');
      expect(existingUser.save).toHaveBeenCalled();
      expect(result.user.email).toBe('existing@example.com');
    });

    it('should throw UnauthorizedException for invalid Google token', async () => {
      mockOAuth2Client.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.googleAuth('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if Google account has no email', async () => {
      mockOAuth2Client.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-sub-111',
          name: 'No Email User',
        }),
      });

      await expect(service.googleAuth('token-without-email')).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens when valid refreshToken is provided', async () => {
      const rawRefreshToken = 'valid-refresh-token';
      const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);

      mockJwtService.verifyAsync.mockResolvedValue({ id: '507f1f77bcf86cd799439011' });

      const userDoc = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        role: UserRole.BUYER,
        refreshTokenHash: hashedRefreshToken,
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userDoc),
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.refreshToken({ refreshToken: rawRefreshToken });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash on logout', async () => {
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.logout('507f1f77bcf86cd799439011');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        refreshTokenHash: null,
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('forgotPassword and resetPassword', () => {
    it('should generate reset token and send email in forgotPassword', async () => {
      const userDoc = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        fullName: 'User Name',
      };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userDoc),
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.forgotPassword({ email: 'user@example.com' });
      expect(result.message).toContain('If an account with that email exists');
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should update password and invalidate sessions in resetPassword', async () => {
      const userDoc = {
        _id: '507f1f77bcf86cd799439011',
      };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userDoc),
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.resetPassword({
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toBe('Password has been updated successfully');
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          resetPasswordToken: null,
          resetPasswordExpires: null,
          refreshTokenHash: null,
        }),
      );
    });
  });
});
