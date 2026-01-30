/**
 * realtime.gateway.ts
 *
 * WebSocket gateway for real-time event broadcasting.
 * Handles sync status updates, notifications, and live data refresh.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Event types for real-time updates
export enum RealtimeEvent {
  SYNC_STATUS = 'sync:status',
  SYNC_COMPLETE = 'sync:complete',
  SYNC_ERROR = 'sync:error',
  DATA_UPDATE = 'data:update',
  NOTIFICATION = 'notification',
}

export interface RealtimePayload {
  event: RealtimeEvent;
  entityType: string;
  entityId: string;
  data: any;
  userId?: string;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients: Map<string, { userId: string; socket: Socket }> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Handle new connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (token) {
        const payload = this.jwtService.verify(token as string);
        const userId = payload.sub || payload.userId;

        this.connectedClients.set(client.id, { userId, socket: client });

        // Join user-specific room for targeted messages
        client.join(`user:${userId}`);

        this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      } else {
        this.logger.warn(`Client connected without auth: ${client.id}`);
      }
    } catch (error) {
      this.logger.warn(`Invalid auth token for client: ${client.id}`);
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${clientInfo.userId})`);
      this.connectedClients.delete(client.id);
    }
  }

  /**
   * Subscribe to entity updates
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { entityType: string; entityId?: string }
  ) {
    const room = data.entityId ? `${data.entityType}:${data.entityId}` : `${data.entityType}:all`;
    client.join(room);
    this.logger.debug(`Client ${client.id} subscribed to ${room}`);
    return { success: true, room };
  }

  /**
   * Unsubscribe from entity updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { entityType: string; entityId?: string }
  ) {
    const room = data.entityId ? `${data.entityType}:${data.entityId}` : `${data.entityType}:all`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} unsubscribed from ${room}`);
    return { success: true };
  }

  /**
   * Broadcast sync status update
   */
  broadcastSyncStatus(
    entityType: string,
    entityId: string,
    status: 'SYNCING' | 'SYNCED' | 'FAILED',
    error?: string
  ) {
    const payload: RealtimePayload = {
      event: status === 'FAILED' ? RealtimeEvent.SYNC_ERROR : RealtimeEvent.SYNC_STATUS,
      entityType,
      entityId,
      data: { status, error },
      timestamp: new Date().toISOString(),
    };

    // Broadcast to entity-specific room
    this.server.to(`${entityType}:${entityId}`).emit(payload.event, payload);
    // Also broadcast to "all" room for list views
    this.server.to(`${entityType}:all`).emit(payload.event, payload);

    this.logger.debug(`Broadcast ${payload.event} for ${entityType}:${entityId}`);
  }

  /**
   * Broadcast data update (after create/update/delete)
   */
  broadcastDataUpdate(
    entityType: string,
    entityId: string,
    action: 'created' | 'updated' | 'deleted',
    data: any
  ) {
    const payload: RealtimePayload = {
      event: RealtimeEvent.DATA_UPDATE,
      entityType,
      entityId,
      data: { action, ...data },
      timestamp: new Date().toISOString(),
    };

    this.server.to(`${entityType}:all`).emit(payload.event, payload);
    this.logger.debug(`Broadcast data:update for ${entityType}:${entityId} (${action})`);
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, title: string, message: string, metadata?: any) {
    const payload: RealtimePayload = {
      event: RealtimeEvent.NOTIFICATION,
      entityType: 'notification',
      entityId: '',
      data: { title, message, ...metadata },
      userId,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`user:${userId}`).emit(payload.event, payload);
    this.logger.debug(`Sent notification to user:${userId}`);
  }

  /**
   * Get connected client count
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }
}
