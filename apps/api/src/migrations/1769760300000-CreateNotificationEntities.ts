import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationEntities1769760300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_templates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(20) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        email_subject VARCHAR(200),
        email_body TEXT,
        message_body TEXT,
        variables TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_templates_category
      ON notification_templates (category, is_active)
    `);

    // Create notification_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(36),
        recipient_email VARCHAR(100),
        recipient_phone VARCHAR(30),
        recipient_line_id VARCHAR(50),
        channel VARCHAR(20) NOT NULL,
        template_code VARCHAR(50),
        subject VARCHAR(200),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        error_message TEXT,
        related_entity_type VARCHAR(50),
        related_entity_id VARCHAR(36),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_user
      ON notification_logs (user_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_status
      ON notification_logs (status, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_channel
      ON notification_logs (channel, created_at DESC)
    `);

    // Insert default templates
    await queryRunner.query(`
      INSERT INTO notification_templates (code, name, category, channel, email_subject, email_body, is_active)
      VALUES
        ('WELCOME_USER', '歡迎新用戶', 'SYSTEM', 'EMAIL',
         '歡迎加入森騰 ERP 系統',
         '<h1>歡迎，{{ userName }}！</h1><p>感謝您加入森騰 ERP 系統。</p>',
         true),
        ('PROJECT_CREATED', '專案建立通知', 'PROJECT', 'EMAIL',
         '新專案已建立：{{ projectName }}',
         '<h1>專案建立成功</h1><p>專案「{{ projectName }}」已成功建立。<br/><a href="{{ projectUrl }}">點擊查看</a></p>',
         true),
        ('PAYMENT_REMINDER', '付款提醒', 'PAYMENT', 'EMAIL',
         '付款提醒：發票 {{ invoiceNumber }}',
         '<h1>付款提醒</h1><p>發票編號：{{ invoiceNumber }}<br/>金額：{{ amount }}<br/>到期日：{{ dueDate }}</p>',
         true)
      ON CONFLICT (code) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notification_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_templates`);
  }
}
