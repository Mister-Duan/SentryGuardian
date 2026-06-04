import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { buildDsn } from '../src/dsn.js';

const prisma = new PrismaClient();

/**
 * Seed default org, admin user, and demo project with DSN.
 * 写入默认组织、管理员与演示项目（含 DSN）。
 */
async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@localhost';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'adminadmin';
  const ingestHost = process.env.SEED_INGEST_HOST ?? 'localhost:3001';

  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      organizationId: org.id,
    },
  });

  const publicKey = randomBytes(16).toString('hex');
  const project = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: org.id,
        slug: 'default',
      },
    },
    update: {},
    create: {
      name: 'Default Project',
      slug: 'default',
      publicKey,
      organizationId: org.id,
    },
  });

  const dsn = buildDsn(project.publicKey, project.id, ingestHost);

  console.log('Seed complete / 种子数据已写入:');
  console.log(`  Admin / 管理员: ${adminEmail}`);
  console.log(`  Project ID / 项目 ID: ${project.id}`);
  console.log(`  DSN: ${dsn}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
