import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;
  let dataSource: DataSource;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as any;

  describe('canActivate', () => {
    it('should return true when no permissions required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockExecutionContext({
        sub: 'user-1',
        role: 'user',
        roleId: 'role-123',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['projects:read']);

      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should return true for admin users', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['projects:read']);

      const context = createMockExecutionContext({
        sub: 'admin-1',
        role: 'admin',
        roleId: 'admin-role',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true for super_admin users', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['projects:delete']);

      const context = createMockExecutionContext({
        sub: 'super-1',
        role: 'super_admin',
        roleId: 'super-role',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should check user permissions from database for regular users', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['projects:read']);
      mockDataSource.query.mockResolvedValue([
        { permission_id: 'projects:read' },
        { permission_id: 'projects:create' },
      ]);

      const context = createMockExecutionContext({
        sub: 'user-1',
        role: 'user',
        roleId: 'role-123',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT permission_id FROM role_permissions'),
        ['user']
      );
    });

    it('should throw ForbiddenException when user lacks required permission', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['users:delete']);
      mockDataSource.query.mockResolvedValue([{ permission_id: 'projects:read' }]);

      const context = createMockExecutionContext({
        sub: 'user-1',
        role: 'user',
        roleId: 'role-123',
      });

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should support wildcard permissions', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(['projects:read']);
      mockDataSource.query.mockResolvedValue([{ permission_id: 'projects:*' }]);

      const context = createMockExecutionContext({
        sub: 'user-1',
        role: 'user',
        roleId: 'role-123',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
