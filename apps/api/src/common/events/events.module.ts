import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventListeners } from './event-listeners';
import { NotificationsModule } from '../../modules/notifications/notifications.module';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for flexible event matching
      wildcard: true,
      // Delimiter for namespaced events
      delimiter: '.',
      // Maximum number of listeners per event
      maxListeners: 10,
      // Emit errors for unhandled events
      verboseMemoryLeak: true,
      // Ignore errors from listeners
      ignoreErrors: false,
    }),
    NotificationsModule,
  ],
  providers: [EventListeners],
  exports: [EventEmitterModule],
})
export class EventsModule {}
