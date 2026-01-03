/**
 * Mock para Backblaze B2 Service
 * Usado em testes unitários para simular operações de storage
 */
import { jest } from '@jest/globals';

export const mockBackblazeService = {
  uploadToBackblaze: jest.fn(),
  deleteFromBackblaze: jest.fn(),
  generatePresignedUrl: jest.fn(),
  getFileInfo: jest.fn(),
  listFiles: jest.fn(),
};

// Mock default responses
export const mockUploadResponse = {
  url: 'https://b2.example.com/arquivo-teste.pdf',
  key: 'arquivos/arquivo-teste.pdf',
  bucket: 'test-bucket',
  uploadedAt: new Date('2024-01-01T10:00:00Z'),
};

export const mockPresignedUrl = 'https://b2.example.com/arquivo-teste.pdf?token=abc123';

// Setup default mock implementations
export function setupBackblazeMocks() {
  mockBackblazeService.uploadToBackblaze.mockResolvedValue(mockUploadResponse);
  mockBackblazeService.deleteFromBackblaze.mockResolvedValue(undefined);
  mockBackblazeService.generatePresignedUrl.mockResolvedValue(mockPresignedUrl);
  mockBackblazeService.getFileInfo.mockResolvedValue({
    fileName: 'arquivo-teste.pdf',
    contentType: 'application/pdf',
    contentLength: 1024000,
    uploadTimestamp: new Date('2024-01-01T10:00:00Z').getTime(),
  });
  mockBackblazeService.listFiles.mockResolvedValue({
    files: [],
    nextFileName: null,
  });
}

// Reset all mocks
export function resetBackblazeMocks() {
  Object.values(mockBackblazeService).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}

// Jest mock module
jest.mock('@/lib/storage/backblaze-b2.service', () => mockBackblazeService);
