import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor() {
    // Prevent re-initialization if the module reloads
    if (!admin.apps.length) {
      try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        // Robust parsing: Strips surrounding quotes from .env and fixes escaped newlines
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        if (privateKey) {
          privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
        }

        if (!projectId || !clientEmail || !privateKey) {
          this.logger.warn(
            'Firebase credentials missing in .env. FCM notifications will be skipped.',
          );
          return;
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

        this.logger.log('Firebase Admin SDK initialized successfully.');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error);
      }
    }
  }

  /**
   * Send a broadcast to all users subscribed to a specific topic.
   * Useful for "security_alerts_rw07".
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: { sound: 'default' },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(
        `Successfully sent message to topic ${topic}: ${response}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error sending message to topic ${topic}`, error);
      return false;
    }
  }

  /**
   * Send a direct message to a specific device.
   * Useful for targeted alerts (e.g., Substitute Shift Assignment).
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!token) return false;

    try {
      const message: admin.messaging.Message = {
        token,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(
        `Successfully sent message to device ${token.substring(0, 10)}...`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error sending message to device`, error);
      return false;
    }
  }

  /**
   * Send a message to multiple specific devices.
   * Useful for alerting all OTHER Linmas when someone claims an incident.
   */
  async sendToDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const validTokens = tokens.filter((t) => t && t.trim() !== '');
    if (validTokens.length === 0) return false;

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: validTokens,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Multicast sent. Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending multicast message', error);
      return false;
    }
  }
}
