import admin from 'firebase-admin';
import type {
  PushNotificationGateway,
  PushNotificationMessage,
} from '../../application/ports/push-notification-gateway';
import { config } from '../config/env';

export class FirebasePushNotificationGateway implements PushNotificationGateway {
  constructor() {
    initializeFirebase();
  }

  async sendMulticast(message: PushNotificationMessage): Promise<void> {
    if (message.tokens.length === 0) {
      return;
    }

    await admin.messaging().sendEachForMulticast({
      tokens: message.tokens,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data,
    });
  }
}

function initializeFirebase(): void {
  if (admin.apps.length > 0) {
    return;
  }

  if (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: config.firebasePrivateKey,
      }),
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
