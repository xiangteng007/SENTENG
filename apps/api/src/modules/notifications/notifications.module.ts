import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationTemplate } from './notification-template.entity';
import { NotificationLog } from './notification-log.entity';
import { WeatherAlert } from './weather-alert.entity';
import { LineNotifyService } from './line-notify.service';
import { EmailService } from './email.service';
import { PushNotificationService } from './push-notification.service';
import { WeatherAlertService } from './weather-alert.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([NotificationTemplate, NotificationLog, WeatherAlert]),
  ],
  providers: [LineNotifyService, EmailService, PushNotificationService, WeatherAlertService],
  exports: [LineNotifyService, EmailService, PushNotificationService, WeatherAlertService],
})
export class NotificationsModule {}
