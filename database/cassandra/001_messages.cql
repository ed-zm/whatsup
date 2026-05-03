CREATE KEYSPACE IF NOT EXISTS whatsup_messages
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 1
}
AND durable_writes = true;

USE whatsup_messages;

CREATE TABLE IF NOT EXISTS messages_by_conversation_day (
  conversation_id uuid,
  message_day date,
  sent_at timestamp,
  message_id timeuuid,
  sender_user_id uuid,
  recipient_user_ids set<uuid>,
  message_type text,
  body text,
  media_url text,
  reply_to_message_id timeuuid,
  client_message_id text,
  status text,
  metadata map<text, text>,
  created_at timestamp,
  edited_at timestamp,
  deleted_at timestamp,
  PRIMARY KEY ((conversation_id, message_day), sent_at, message_id)
) WITH CLUSTERING ORDER BY (sent_at DESC, message_id DESC)
  AND default_time_to_live = 0
  AND compaction = {
    'class': 'TimeWindowCompactionStrategy',
    'compaction_window_unit': 'DAYS',
    'compaction_window_size': '1'
  };

/*
Query principal soportada:

SELECT *
FROM messages_by_conversation_day
WHERE conversation_id = ?
  AND message_day = ?
  AND sent_at < ?
LIMIT ?;

Notas de modelado:
- Partition key: (conversation_id, message_day) mantiene las lecturas por chat y limita el tamaño de partición por día.
- Clustering key: sent_at DESC, message_id DESC optimiza la paginación cronológica inversa típica del historial.
- message_id usa timeuuid para desempatar mensajes con el mismo sent_at y mantener orden estable.
- No usar ALLOW FILTERING para lecturas de producto; crear tablas por query cuando aparezcan nuevos patrones.
*/
