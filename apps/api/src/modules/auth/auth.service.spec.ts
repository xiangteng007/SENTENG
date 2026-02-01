import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    authProvider: 'google',
    authUid: 'google-uid-123',
    lastLoginAt: new Date(),
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    authProvider: 'google',
    authUid: 'google-uid-456',
    lastLoginAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when found by email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      const result = await service.validateUser('test@example.com');
      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token and user info', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token-123');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(mockUser, 'user');

      expect(result).toEqual({
        access_token: 'jwt-token-123',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: 'user',
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: 'user',
      });
      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
    });

    it('should include admin role in JWT when user is admin', async () => {
      mockJwtService.sign.mockReturnValue('admin-jwt-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(mockAdminUser, 'admin');

      expect(result.user.role).toBe('admin');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'admin' })
      );
    });

    it('should default to user role if not specified', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.login(mockUser);

      expect(result.user.role).toBe('user');
    });
  });

  describe('loginOrCreate', () => {
    const googleProfile = {
      email: 'newuser@example.com',
      name: 'New User',
      provider: 'google',
      uid: 'new-google-uid',
    };

    it('should login existing user without creating new one', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('returning-user-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.loginOrCreate(googleProfile);

      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(result.access_token).toBe('returning-user-token');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should create new user if not exists', async () => {
      const newUser = { ...mockUser, email: googleProfile.email, name: googleProfile.name };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('new-user-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.loginOrCreate(googleProfile);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        email: googleProfile.email,
        name: googleProfile.name,
        authProvider: googleProfile.provider,
        authUid: googleProfile.uid,
      });
      expect(result.access_token).toBe('new-user-token');
    });

    it('should use role from database, not from profile (security)', async () => {
      // Even if somehow a malicious profile included role, it should be ignored
      mockUsersService.findByEmail.mockResolvedValue(mockAdminUser);
      mockJwtService.sign.mockReturnValue('admin-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.loginOrCreate(googleProfile);

      // Role comes from database (admin), not from profile
      expect(result.user.role).toBe('admin');
    });

    it('should default to user role for new users', async () => {
      const newUserNoRole = { ...mockUser, role: undefined };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUserNoRole);
      mockJwtService.sign.mockReturnValue('new-user-token');
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);

      const result = await service.loginOrCreate(googleProfile);

      expect(result.user.role).toBe('user');
    });
  });
});
