export { authApi } from './auth.js';
export { linksApi } from './links.js';

export type { AuthMutationResponse, LoginRequest } from './auth.js';
export type {
  CreateLinkRequest,
  LinkResponse,
  UpdateLinkRequest,
} from './links.js';
export type { ApiEndpoint, ApiEndpointWithBody, ApiMethod } from './types.js';
