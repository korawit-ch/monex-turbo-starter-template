import { PERMISSIONS, type Permission } from '@repo/authorization';
import type { UserRole } from '@repo/prisma';

const memberPermissions: Permission[] = ['link.read', 'link.create'];

export function permissionsForRole(role: UserRole): Permission[] {
  return role === 'ADMIN' ? [...PERMISSIONS] : [...memberPermissions];
}
