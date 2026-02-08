/**
 * We must mock @nestjs/config before any imports because
 * push-notification.service.ts imports ConfigService at the module level.
 */
const mockGet = jest.fn().mockReturnValue(undefined);
jest.mock("@nestjs/config", () => ({
  ConfigService: class MockConfigService {
    get = mockGet;
  },
}));

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PushNotificationService } from "./push-notification.service";
import {
  NotificationLog,
  NotificationStatus,
} from "./notification-log.entity";
import {
  NotificationTemplate,
  NotificationChannel,
} from "./notification-template.entity";

const mockSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: { p256dh: "test-p256dh-key", auth: "test-auth-key" },
};

describe("PushNotificationService", () => {
  let service: PushNotificationService;
  let logRepo: Record<string, jest.Mock>;
  let templateRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    logRepo = {
      create: jest.fn((dto) => ({ id: "log-1", ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    templateRepo = {
      findOne: jest.fn(),
    };

    // ConfigService is auto-resolved via jest.mock above
    const { ConfigService } = require("@nestjs/config");

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: ConfigService,
          useValue: new ConfigService(),
        },
        { provide: getRepositoryToken(NotificationLog), useValue: logRepo },
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: templateRepo,
        },
      ],
    }).compile();

    service = module.get(PushNotificationService);
  });

  // ============================
  // SEND (mock mode — no VAPID keys)
  // ============================

  describe("send", () => {
    it("should send a push notification (mock mode)", async () => {
      const result = await service.send(mockSubscription, {
        title: "工程通知",
        body: "基礎施工已完成",
      });

      expect(result.success).toBe(true);
      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: NotificationChannel.PUSH,
          subject: "工程通知",
          message: "基礎施工已完成",
          status: NotificationStatus.PENDING,
        }),
      );
      expect(logRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationStatus.SENT,
          sentAt: expect.any(Date),
        }),
      );
    });

    it("should record userId when provided", async () => {
      await service.send(
        mockSubscription,
        { title: "Test", body: "Body" },
        "user-123",
      );

      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-123" }),
      );
    });
  });

  // ============================
  // TEMPLATE
  // ============================

  describe("sendFromTemplate", () => {
    it("should interpolate template variables", async () => {
      templateRepo.findOne.mockResolvedValue({
        name: "建築通知",
        messageBody: "{{project}} 在 {{date}} 有新進度",
        isActive: true,
      });

      const result = await service.sendFromTemplate(
        "construction_update",
        mockSubscription,
        { project: "陽明山別墅", date: "03/15" },
      );

      expect(result.success).toBe(true);
      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "建築通知",
          message: "陽明山別墅 在 03/15 有新進度",
        }),
      );
    });

    it("should return error for missing template", async () => {
      templateRepo.findOne.mockResolvedValue(null);
      const result = await service.sendFromTemplate(
        "nonexistent",
        mockSubscription,
        {},
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  // ============================
  // BROADCAST
  // ============================

  describe("broadcast", () => {
    it("should send to multiple subscriptions and count results", async () => {
      const subs = [
        mockSubscription,
        { ...mockSubscription, endpoint: "https://other/endpoint" },
      ];
      const result = await service.broadcast(subs, {
        title: "廣播",
        body: "全員通知",
      });

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(logRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  // ============================
  // WEATHER ALERT
  // ============================

  describe("sendWeatherAlert", () => {
    it("should format weather alert as push notification", async () => {
      const result = await service.sendWeatherAlert(
        mockSubscription,
        "豪雨特報",
        "台北市",
        "預計降雨量超過 200mm",
        "user-1",
      );

      expect(result.success).toBe(true);
      expect(logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "⚠️ 豪雨特報",
          message: "台北市: 預計降雨量超過 200mm",
        }),
      );
    });
  });
});
