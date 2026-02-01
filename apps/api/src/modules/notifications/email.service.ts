/**
 * email.service.ts
 *
 * Email notification service - Mock mode when nodemailer is not installed
 */

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLog, NotificationStatus } from "./notification-log.entity";
import {
  NotificationTemplate,
  NotificationChannel,
} from "./notification-template.entity";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter: any = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {
    this.initTransporter();
  }

  private initTransporter(): void {
    try {
      // Try to load nodemailer - optional dependency

      const nodemailer = require("nodemailer");

      const smtpHost = this.configService.get("SMTP_HOST");
      const smtpPort = this.configService.get("SMTP_PORT");
      const smtpUser = this.configService.get("SMTP_USER");
      const smtpPass = this.configService.get("SMTP_PASS");

      if (!smtpHost || !smtpUser) {
        this.logger.warn(
          "SMTP not configured. Email service will operate in mock mode.",
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587", 10),
        secure: smtpPort === "465",
        auth: { user: smtpUser, pass: smtpPass },
      });

      this.logger.log("Email service initialized successfully");
    } catch {
      this.logger.warn(
        "Nodemailer not installed. Email service will operate in mock mode.",
      );
    }
  }

  async send(options: EmailOptions, userId?: string): Promise<SendEmailResult> {
    const log = this.logRepository.create({
      channel: NotificationChannel.EMAIL,
      recipientEmail: Array.isArray(options.to)
        ? options.to.join(", ")
        : options.to,
      subject: options.subject,
      message: options.html,
      userId,
      status: NotificationStatus.PENDING,
    });

    try {
      if (!this.transporter) {
        this.logger.warn(
          `[MOCK] Would send email to ${options.to}: ${options.subject}`,
        );
        log.status = NotificationStatus.SENT;
        log.sentAt = new Date();
        await this.logRepository.save(log);
        return { success: true, messageId: "mock-" + Date.now() };
      }

      const fromAddress = this.configService.get(
        "SMTP_FROM",
        "noreply@senteng.com.tw",
      );
      const result = await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      log.status = NotificationStatus.SENT;
      log.sentAt = new Date();
      await this.logRepository.save(log);

      this.logger.log(`Email sent to ${options.to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      log.status = NotificationStatus.FAILED;
      log.errorMessage = error instanceof Error ? error.message : String(error);
      await this.logRepository.save(log);
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return { success: false, error: log.errorMessage };
    }
  }

  async sendFromTemplate(
    templateCode: string,
    to: string | string[],
    variables: Record<string, string>,
    userId?: string,
  ): Promise<SendEmailResult> {
    const template = await this.templateRepository.findOne({
      where: {
        code: templateCode,
        channel: NotificationChannel.EMAIL,
        isActive: true,
      },
    });

    if (!template) {
      return { success: false, error: `Template ${templateCode} not found` };
    }

    let subject = template.emailSubject || "";
    let html = template.emailBody || "";

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
    }

    return this.send({ to, subject, html }, userId);
  }

  async sendWelcomeEmail(
    email: string,
    userName: string,
    userId?: string,
  ): Promise<SendEmailResult> {
    return this.sendFromTemplate("WELCOME_USER", email, { userName }, userId);
  }

  async sendProjectCreatedEmail(
    email: string,
    projectName: string,
    projectUrl: string,
    userId?: string,
  ): Promise<SendEmailResult> {
    return this.sendFromTemplate(
      "PROJECT_CREATED",
      email,
      { projectName, projectUrl },
      userId,
    );
  }

  async sendPaymentReminderEmail(
    email: string,
    invoiceNumber: string,
    amount: string,
    dueDate: string,
    userId?: string,
  ): Promise<SendEmailResult> {
    return this.sendFromTemplate(
      "PAYMENT_REMINDER",
      email,
      { invoiceNumber, amount, dueDate },
      userId,
    );
  }
}
