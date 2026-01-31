import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { RbacService } from "./rbac.service";
import { Role, Permission, UserRole } from "./entities";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("RbacService", () => {
  let service: RbacService;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let permissionRepo: jest.Mocked<Repository<Permission>>;
  let userRoleRepo: jest.Mocked<Repository<UserRole>>;

  const mockRole: Partial<Role> = {
    id: "ROLE_ADMIN",
    name: "Admin",
    description: "System Administrator",
    level: 100,
    isActive: true,
    permissions: [],
  };

  const mockPermission: Partial<Permission> = {
    id: "vendors:read",
    module: "vendors",
    action: "read",
    description: "View vendors",
  };

  const mockUserRole: Partial<UserRole> = {
    userId: "USR-001",
    roleId: "ROLE_ADMIN",
    businessUnitId: "*",
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
    roleRepo = module.get(getRepositoryToken(Role));
    permissionRepo = module.get(getRepositoryToken(Permission));
    userRoleRepo = module.get(getRepositoryToken(UserRole));
  });

  describe("findAllRoles", () => {
    it("should return all active roles", async () => {
      roleRepo.find.mockResolvedValue([mockRole as Role]);
      const result = await service.findAllRoles();
      expect(result).toEqual([mockRole]);
      expect(roleRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ["permissions"],
        order: { level: "DESC" },
      });
    });
  });

  describe("findRoleById", () => {
    it("should return role by id", async () => {
      roleRepo.findOne.mockResolvedValue(mockRole as Role);
      const result = await service.findRoleById("ROLE_ADMIN");
      expect(result).toEqual(mockRole);
    });

    it("should throw NotFoundException if role not found", async () => {
      roleRepo.findOne.mockResolvedValue(null);
      await expect(service.findRoleById("INVALID")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAllPermissions", () => {
    it("should return all permissions ordered by module and action", async () => {
      permissionRepo.find.mockResolvedValue([mockPermission as Permission]);
      const result = await service.findAllPermissions();
      expect(result).toEqual([mockPermission]);
      expect(permissionRepo.find).toHaveBeenCalledWith({
        order: { module: "ASC", action: "ASC" },
      });
    });
  });

  describe("getUserPermissions", () => {
    it("should return empty array if user has no roles", async () => {
      userRoleRepo.find.mockResolvedValue([]);
      const result = await service.getUserPermissions("USR-999");
      expect(result).toEqual([]);
    });

    it("should return permissions for user with roles", async () => {
      const roleWithPermissions = {
        ...mockRole,
        permissions: [mockPermission as Permission],
      };
      userRoleRepo.find.mockResolvedValue([mockUserRole as UserRole]);
      roleRepo.find.mockResolvedValue([roleWithPermissions as Role]);

      const result = await service.getUserPermissions("USR-001");
      expect(result).toContain("vendors:read");
    });
  });

  describe("hasPermission", () => {
    it("should return true if user has permission", async () => {
      jest
        .spyOn(service, "getUserPermissions")
        .mockResolvedValue(["vendors:read", "vendors:create"]);
      const result = await service.hasPermission("USR-001", "vendors:read");
      expect(result).toBe(true);
    });

    it("should return false if user lacks permission", async () => {
      jest.spyOn(service, "getUserPermissions").mockResolvedValue([]);
      const result = await service.hasPermission("USR-001", "admin:delete");
      expect(result).toBe(false);
    });
  });

  describe("assignRoleToUser", () => {
    it("should create new user role assignment", async () => {
      roleRepo.findOne.mockResolvedValue(mockRole as Role);
      userRoleRepo.findOne.mockResolvedValue(null);
      userRoleRepo.create.mockReturnValue(mockUserRole as UserRole);
      userRoleRepo.save.mockResolvedValue(mockUserRole as UserRole);

      const result = await service.assignRoleToUser(
        "USR-001",
        "ROLE_ADMIN",
        "*",
        "ADMIN"
      );
      expect(result).toEqual(mockUserRole);
      expect(userRoleRepo.create).toHaveBeenCalled();
    });

    it("should reactivate existing inactive assignment", async () => {
      const inactiveRole = { ...mockUserRole, isActive: false };
      roleRepo.findOne.mockResolvedValue(mockRole as Role);
      userRoleRepo.findOne.mockResolvedValue(inactiveRole as UserRole);
      userRoleRepo.save.mockResolvedValue({ ...inactiveRole, isActive: true } as UserRole);

      const result = await service.assignRoleToUser("USR-001", "ROLE_ADMIN");
      expect(result.isActive).toBe(true);
    });
  });

  describe("checkAccess", () => {
    it("should not throw if user has permission", async () => {
      jest.spyOn(service, "hasPermission").mockResolvedValue(true);
      await expect(
        service.checkAccess("USR-001", "vendors:read")
      ).resolves.not.toThrow();
    });

    it("should throw ForbiddenException if user lacks permission", async () => {
      jest.spyOn(service, "hasPermission").mockResolvedValue(false);
      await expect(service.checkAccess("USR-001", "admin:delete")).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
