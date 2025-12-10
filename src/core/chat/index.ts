import { ChatRepository } from './repository';
import { ChatService } from './service';

const chatRepository = new ChatRepository();
export const chatService = new ChatService(chatRepository);

export * from './domain';
export * from './repository';
export * from './service';
