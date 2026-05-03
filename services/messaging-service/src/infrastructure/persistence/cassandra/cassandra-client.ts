import { Client } from 'cassandra-driver';
import { config } from '../../config/env';

export const cassandraClient = new Client({
  contactPoints: config.cassandraContactPoints,
  localDataCenter: config.cassandraLocalDataCenter,
  keyspace: config.cassandraKeyspace,
});
