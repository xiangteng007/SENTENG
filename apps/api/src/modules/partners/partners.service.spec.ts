import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { PartnersService } from "./partners.service";
import { Partner, PartnerType, SyncStatus } from "./partner.entity";
import { PartnerContact } from "./partner-contact.entity";

describe("PartnersService", () => {
  let service: PartnersService;
  let partnerRepo: Record<string, jest.Mock>;
  let contactRepo: Record<string, jest.Mock>;

  const mockPartner: Partial<Partner> = {
    id: "p-001",
    name: "台灣建設",
    type: PartnerType.CLIENT,
    phone: "02-12345678",
    email: "info@tw-build.com",
    syncStatus: SyncStatus.UNSYNCED,
    createdAt: new Date(),
    contacts: [],
  };

  const mockContact: Partial<PartnerContact> = {
    id: "c-001",
    partnerId: "p-001",
    name: "王大明",
    title: "經理",
    phone: "0912-345678",
    email: "wang@tw-build.com",
    syncStatus: SyncStatus.UNSYNCED,
  };

  beforeEach(async () => {
    partnerRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[mockPartner], 1]),
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: "p-new", ...entity })),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    contactRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: "c-new", ...entity })),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersService,
        { provide: getRepositoryToken(Partner), useValue: partnerRepo },
        { provide: getRepositoryToken(PartnerContact), useValue: contactRepo },
      ],
    }).compile();

    service = module.get<PartnersService>(PartnersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────── Partner CRUD ────────

  describe("findAll", () => {
    it("should return paginated partners", async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should apply search filter", async () => {
      await service.findAll({ page: 1, limit: 10, search: "台灣" });

      const call = partnerRepo.findAndCount.mock.calls[0][0];
      expect(call.where).toBeInstanceOf(Array); // Like conditions
    });

    it("should apply type filter", async () => {
      await service.findAll({
        page: 1,
        limit: 10,
        type: PartnerType.VENDOR,
      });

      expect(partnerRepo.findAndCount).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return partner when found", async () => {
      partnerRepo.findOne.mockResolvedValue(mockPartner);

      const result = await service.findOne("p-001");
      expect(result).toEqual(mockPartner);
    });

    it("should throw NotFoundException when not found", async () => {
      partnerRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create partner with sync status UNSYNCED", async () => {
      const dto = {
        name: "新公司",
        type: PartnerType.CLIENT,
        phone: "02-99887766",
      };

      const result = await service.create(dto, "user-1");

      expect(partnerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "新公司",
          syncStatus: SyncStatus.UNSYNCED,
          createdBy: "user-1",
        }),
      );
      expect(result).toBeDefined();
    });

    it("should create partner with contacts", async () => {
      const dto = {
        name: "新公司",
        type: PartnerType.VENDOR,
        contacts: [{ name: "測試人", phone: "0911111111" }],
      };

      await service.create(dto);

      expect(contactRepo.create).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update partner and set sync status to PENDING", async () => {
      partnerRepo.findOne.mockResolvedValue({ ...mockPartner });

      const result = await service.update("p-001", { name: "更新後名稱" });

      expect(partnerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "更新後名稱",
          syncStatus: SyncStatus.PENDING,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException for non-existent partner", async () => {
      partnerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { name: "test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should soft delete partner", async () => {
      partnerRepo.findOne.mockResolvedValue(mockPartner);

      await service.remove("p-001");

      expect(partnerRepo.softRemove).toHaveBeenCalledWith(mockPartner);
    });
  });

  // ──────── Contact CRUD ────────

  describe("addContact", () => {
    it("should add contact to existing partner", async () => {
      partnerRepo.findOne.mockResolvedValue(mockPartner);

      const dto = { name: "新聯絡人", phone: "0922222222" };
      const result = await service.addContact("p-001", dto, "user-1");

      expect(contactRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerId: "p-001",
          createdBy: "user-1",
          syncStatus: SyncStatus.UNSYNCED,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should throw when partner not found", async () => {
      partnerRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addContact("nonexistent", { name: "test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateContact", () => {
    it("should update existing contact", async () => {
      contactRepo.findOne.mockResolvedValue({ ...mockContact });

      const result = await service.updateContact("p-001", "c-001", {
        name: "新名稱",
      });

      expect(contactRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "新名稱",
          syncStatus: SyncStatus.PENDING,
        }),
      );
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException for non-existent contact", async () => {
      contactRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateContact("p-001", "nonexistent", { name: "test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("removeContact", () => {
    it("should remove contact", async () => {
      contactRepo.findOne.mockResolvedValue(mockContact);

      await service.removeContact("p-001", "c-001");

      expect(contactRepo.remove).toHaveBeenCalledWith(mockContact);
    });

    it("should throw NotFoundException for non-existent contact", async () => {
      contactRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removeContact("p-001", "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ──────── Helpers ────────

  describe("findByType", () => {
    it("should find partners by type", async () => {
      partnerRepo.find.mockResolvedValue([mockPartner]);

      const result = await service.findByType(PartnerType.CLIENT);

      expect(partnerRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: PartnerType.CLIENT },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getClients / getVendors", () => {
    it("getClients should call findByType(CLIENT)", async () => {
      partnerRepo.find.mockResolvedValue([]);

      await service.getClients();

      expect(partnerRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: PartnerType.CLIENT },
        }),
      );
    });

    it("getVendors should call findByType(VENDOR)", async () => {
      partnerRepo.find.mockResolvedValue([]);

      await service.getVendors();

      expect(partnerRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: PartnerType.VENDOR },
        }),
      );
    });
  });
});
