import type { ApiEndpointWithBody } from './types.js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthMutationResponse {
  ok: true;
}

export const authApi = {
  login: (
    body: LoginRequest,
  ): ApiEndpointWithBody<LoginRequest, AuthMutationResponse> => ({
    url: '/auth/login',
    method: 'POST',
    body,
  }),
};
