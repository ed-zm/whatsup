import { Kafka, type Consumer } from 'kafkajs';
import type { InboundMessageEvent } from '../../../domain/entities/inbound-message';
import type { ProcessInboundMessageUseCase } from '../../../application/use-cases/process-inbound-message.use-case';

const MESSAGES_INBOUND_TOPIC = 'messages.inbound.v1';

export class InboundMessageConsumer {
  private readonly consumer: Consumer;

  constructor(
    clientId: string,
    brokers: string[],
    groupId: string,
    private readonly processInboundMessageUseCase: ProcessInboundMessageUseCase,
  ) {
    const kafka = new Kafka({ clientId, brokers });
    this.consumer = kafka.consumer({ groupId });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: MESSAGES_INBOUND_TOPIC,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        const event = JSON.parse(message.value.toString()) as InboundMessageEvent;
        await this.processInboundMessageUseCase.execute(event);
      },
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
