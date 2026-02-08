/**
 * Shared Test Helpers for SENTENG API
 *
 * Provides reusable mock factories to reduce boilerplate across spec files.
 * Usage:
 *   import { createMockRepository, createMockQueryBuilder } from '../../common/test-helpers/create-test-module';
 *
 *   const mockRepo = createMockRepository();
 *   // or with custom query builder defaults:
 *   const mockRepo = createMockRepository({ getManyAndCountResult: [[entity], 1] });
 */

import { getRepositoryToken } from "@nestjs/typeorm";

// ─── Mock QueryBuilder ───

export interface QueryBuilderOverrides {
  getManyAndCountResult?: [any[], number];
  getManyResult?: any[];
  getOneResult?: any;
  getRawOneResult?: Record<string, any>;
  getCountResult?: number;
}

/**
 * Creates a chainable mock QueryBuilder that returns `this` for all
 * chaining methods (where, andWhere, orderBy, skip, take, etc.)
 */
export function createMockQueryBuilder(overrides: QueryBuilderOverrides = {}) {
  const qb: Record<string, jest.Mock> = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),

    // Terminal methods
    getManyAndCount: jest
      .fn()
      .mockResolvedValue(overrides.getManyAndCountResult || [[], 0]),
    getMany: jest.fn().mockResolvedValue(overrides.getManyResult || []),
    getOne: jest.fn().mockResolvedValue(overrides.getOneResult || null),
    getRawOne: jest
      .fn()
      .mockResolvedValue(overrides.getRawOneResult || { totalCount: "0" }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(overrides.getCountResult || 0),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  return qb;
}

// ─── Mock Repository ───

export interface MockRepositoryOptions {
  /** Custom overrides for the query builder terminal methods */
  queryBuilder?: QueryBuilderOverrides;
  /** Additional repository methods to mock */
  extraMethods?: Record<string, jest.Mock>;
}

/**
 * Creates a standard TypeORM mock repository with all common methods.
 *
 * @example
 * ```ts
 * const mockRepo = createMockRepository();
 * mockRepo.findOne.mockResolvedValue(mockEntity);
 * ```
 */
export function createMockRepository(options: MockRepositoryOptions = {}) {
  const qb = createMockQueryBuilder(options.queryBuilder);

  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    create: jest.fn().mockImplementation((dto) => ({ ...dto })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => qb),
    merge: jest
      .fn()
      .mockImplementation((entity, dto) => ({ ...entity, ...dto })),
    preload: jest.fn().mockResolvedValue(null),
    ...(options.extraMethods || {}),
  };
}

// ─── Repository Provider Factory ───

/**
 * Creates a NestJS provider for a repository token.
 *
 * @example
 * ```ts
 * const module = await Test.createTestingModule({
 *   providers: [
 *     MyService,
 *     createMockRepoProvider(MyEntity),
 *   ],
 * }).compile();
 *
 * const repo = module.get(getRepositoryToken(MyEntity));
 * ```
 */
export function createMockRepoProvider(
  entity: Function,
  options: MockRepositoryOptions = {},
) {
  const mockRepo = createMockRepository(options);
  return {
    provide: getRepositoryToken(entity),
    useValue: mockRepo,
    __mockRepo: mockRepo, // Expose for direct access in tests
  };
}

// ─── Common Mock Services ───

/**
 * Creates a mock ConfigService with sensible defaults.
 */
export function createMockConfigService(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    JWT_SECRET: "test-secret",
    JWT_EXPIRATION: "1h",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    JWT_REFRESH_EXPIRATION: "7d",
    NODE_ENV: "test",
    ...overrides,
  };

  return {
    get: jest.fn(
      (key: string, defaultValue?: any) => defaults[key] ?? defaultValue,
    ),
    getOrThrow: jest.fn((key: string) => {
      if (defaults[key] === undefined)
        throw new Error(`Missing config: ${key}`);
      return defaults[key];
    }),
  };
}

/**
 * Creates a mock IdGeneratorService.
 */
export function createMockIdGeneratorService(prefix = "TEST") {
  let counter = 0;
  return {
    generate: jest.fn(() => `${prefix}-${String(++counter).padStart(4, "0")}`),
  };
}
