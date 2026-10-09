import prisma from '../src/index';
import { randomBytes, scryptSync } from 'node:crypto';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(password, salt, 64).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: { name: 'Demo Tenant' },
    create: { id: 'demo-tenant', name: 'Demo Tenant' },
  });

  const seedEmail = process.env.AUTH_SEED_EMAIL || 'admin@example.com';
  const seedPassword = process.env.AUTH_SEED_PASSWORD || 'local-change-me';
  await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      name: 'Demo Administrator',
      passwordHash: hashPassword(seedPassword),
      tenantId: tenant.id,
      role: 'ADMIN',
      disabledAt: null,
    },
    create: {
      email: seedEmail,
      name: 'Demo Administrator',
      passwordHash: hashPassword(seedPassword),
      tenantId: tenant.id,
      role: 'ADMIN',
    },
  });

  const links = [
    {
      url: 'https://turborepo.com/docs/getting-started/installation',
      title: 'Installation',
      description: 'Get started with Turborepo in a few moments',
    },
    {
      url: 'https://turborepo.com/docs/crafting-your-repository',
      title: 'Crafting',
      description: 'Architecting a monorepo is a careful process.',
    },
    {
      url: 'https://turborepo.com/docs/getting-started/add-to-existing-repository',
      title: 'Add Repositories',
      description:
        'Turborepo can be incrementally adopted in any repository, single or multi-package, to speed up the developer and CI workflows of the repository.',
    },
  ];

  for (const link of links) {
    await prisma.link.upsert({
      where: {
        tenantId_url: { tenantId: tenant.id, url: link.url },
      },
      update: { title: link.title, description: link.description },
      create: { ...link, tenantId: tenant.id },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
