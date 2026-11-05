import { describe, it, expect } from 'vitest';

import { AppService } from './app.service';

describe('AppService', () => {
  it('describes the API and points to its documentation and endpoints', () => {
    expect(new AppService().getInfo()).toEqual({
      name: 'NestJS API',
      description: 'REST API with Prisma ORM',
      version: '1.0.0',
      docs: '/api',
      endpoints: {
        swagger: 'GET /api',
        links: 'GET /links',
      },
    });
  });
});
