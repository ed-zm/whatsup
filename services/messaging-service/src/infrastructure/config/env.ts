export interface MessagingServiceConfig {
  kafkaClientId: string;
  kafkaBrokers: string[];
  kafkaGroupId: string;
  databaseUrl: string;
  redisUrl: string;
  cassandraContactPoints: string[];
  cassandraLocalDataCenter: string;
  cassandraKeyspace: string;
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function csv(name: string): string[] {
  return required(name)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export const config: MessagingServiceConfig = {
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? 'messaging-service',
  kafkaBrokers: csv('KAFKA_BROKERS'),
  kafkaGroupId: process.env.KAFKA_GROUP_ID ?? 'messaging-router-service',
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  cassandraContactPoints: csv('CASSANDRA_CONTACT_POINTS'),
  cassandraLocalDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER ?? 'datacenter1',
  cassandraKeyspace: process.env.CASSANDRA_KEYSPACE ?? 'whatsup_messages',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
