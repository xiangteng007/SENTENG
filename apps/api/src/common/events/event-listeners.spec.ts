import { Test, TestingModule } from "@nestjs/testing";
import { EventListeners } from "./event-listeners";
import { LineNotifyService } from "../../modules/notifications/line-notify.service";
import { EventNames } from "./event-types";

describe("EventListeners", () => {
  let service: EventListeners;
  let lineNotifyService: jest.Mocked<LineNotifyService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventListeners,
        {
          provide: LineNotifyService,
          useValue: {
            sendTextMessage: jest.fn().mockResolvedValue(undefined),
            broadcast: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<EventListeners>(EventListeners);
    lineNotifyService = module.get(LineNotifyService);
  });

  describe("handleProjectStatusChanged", () => {
    it("should log important status changes", async () => {
      const logSpy = jest.spyOn(service["logger"], "log");
      
      await service.handleProjectStatusChanged({
        projectId: "PRJ-001",
        projectName: "Test Project",
        previousStatus: "in_progress",
        newStatus: "completed",
        userId: "USR-001",
        timestamp: new Date(),
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("PRJ-001 status changed")
      );
    });

    it("should handle non-important status changes", async () => {
      const logSpy = jest.spyOn(service["logger"], "log");
      
      await service.handleProjectStatusChanged({
        projectId: "PRJ-001",
        projectName: "Test Project",
        previousStatus: "draft",
        newStatus: "in_progress",
        userId: "USR-001",
        timestamp: new Date(),
      });

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("handleInvoiceOverdue", () => {
    it("should log overdue invoice warning", async () => {
      const warnSpy = jest.spyOn(service["logger"], "warn");
      
      await service.handleInvoiceOverdue({
        invoiceId: "INV-001",
        invoiceNumber: "INV-2026-0001",
        clientId: "CLI-001",
        amount: 50000,
        daysOverdue: 15,
        timestamp: new Date(),
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("INV-2026-0001 is 15 days overdue")
      );
    });
  });

  describe("handleNotificationSend", () => {
    it("should send LINE notification", async () => {
      await service.handleNotificationSend({
        recipientId: "LINE_USER_ID",
        recipientType: "line",
        title: "Test Title",
        message: "Test Message",
        timestamp: new Date(),
      });

      expect(lineNotifyService.sendTextMessage).toHaveBeenCalledWith(
        "LINE_USER_ID",
        expect.stringContaining("Test Title")
      );
    });

    it("should log email notification as pending", async () => {
      const logSpy = jest.spyOn(service["logger"], "log");
      
      await service.handleNotificationSend({
        recipientId: "user@example.com",
        recipientType: "email",
        title: "Test Title",
        message: "Test Message",
        timestamp: new Date(),
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("Email notification pending")
      );
    });
  });

  describe("handleBroadcast", () => {
    it("should broadcast via LINE", async () => {
      await service.handleBroadcast({
        title: "Broadcast Title",
        message: "Broadcast Message",
        channel: "line",
        timestamp: new Date(),
      });

      expect(lineNotifyService.broadcast).toHaveBeenCalledWith(
        expect.stringContaining("Broadcast Title")
      );
    });

    it("should broadcast to all channels", async () => {
      await service.handleBroadcast({
        title: "All Channel Broadcast",
        message: "Message",
        channel: "all",
        timestamp: new Date(),
      });

      expect(lineNotifyService.broadcast).toHaveBeenCalled();
    });
  });
});
