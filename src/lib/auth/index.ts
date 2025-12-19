export * from './session';
export * from './authorization';
export * from './require-permission';

// api-auth exports - excluding authenticateRequest to avoid conflict with session.ts
// Use authenticateApiRequest for API route authentication
export {
  authenticateRequest as authenticateApiRequest,
  type AuthResult,
} from './api-auth';
