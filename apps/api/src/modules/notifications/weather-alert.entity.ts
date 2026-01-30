/**
 * Weather Alert Entity (天氣警報記錄)
 *
 * 記錄已發送的天氣警報，避免重複推播
 */

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum WeatherAlertType {
  HEAVY_RAIN = 'HEAVY_RAIN', // 大雨特報
  TORRENTIAL_RAIN = 'TORRENTIAL_RAIN', // 豪雨特報
  TYPHOON = 'TYPHOON', // 颱風警報
  LOW_TEMPERATURE = 'LOW_TEMPERATURE', // 低溫特報
  STRONG_WIND = 'STRONG_WIND', // 強風特報
  FOG = 'FOG', // 濃霧特報
  HIGH_TEMPERATURE = 'HIGH_TEMPERATURE', // 高溫資訊
  OTHER = 'OTHER',
}

export enum AlertSeverity {
  ADVISORY = 'ADVISORY', // 注意
  WARNING = 'WARNING', // 警告
  WATCH = 'WATCH', // 特報
}

@Entity('weather_alerts')
@Index(['alertId'], { unique: true })
@Index(['phenomena', 'locationName', 'startTime'])
export class WeatherAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 氣象署原始警報 ID (用於去重) */
  @Column({ name: 'alert_id', length: 100 })
  alertId: string;

  /** 警報類型 */
  @Column({
    type: 'enum',
    enum: WeatherAlertType,
    default: WeatherAlertType.OTHER,
  })
  type: WeatherAlertType;

  /** 現象名稱 (原始 API 回傳值如 "大雨", "豪雨") */
  @Column({ length: 100 })
  phenomena: string;

  /** 意義/嚴重程度 (如 "特報", "警報") */
  @Column({ length: 50, nullable: true })
  significance: string;

  /** 影響區域 */
  @Column({ name: 'location_name', length: 100 })
  locationName: string;

  /** 縣市代碼 */
  @Column({ length: 20, nullable: true })
  geocode: string;

  /** 警報詳細內容 */
  @Column({ type: 'text', nullable: true })
  details: string;

  /** 警報開始時間 */
  @Column({ name: 'start_time', type: 'timestamp', nullable: true })
  startTime?: Date;

  /** 警報結束時間 */
  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime?: Date;

  /** API 發布時間 */
  @Column({ name: 'issue_time', type: 'timestamp', nullable: true })
  issueTime?: Date;

  /** 是否已發送通知 */
  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  /** 通知發送時間 */
  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt?: Date;

  /** 通知發送管道 */
  @Column({ name: 'sent_channels', type: 'simple-array', nullable: true })
  sentChannels: string[];

  /** 發送失敗原因 */
  @Column({ name: 'send_error', type: 'text', nullable: true })
  sendError: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
