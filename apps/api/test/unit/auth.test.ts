import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
test('auth uses password hashes, normalizes email, validates role, and returns generic failures', async () => {
  const password = 'test-only-password-123';
  const user = {
    id: 'test-id',
    email: 'admin@example.test',
    role: 'ADMIN',
    passwordHash: await hash(password, 4),
  };
  const db = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) =>
        where.email === user.email || where.id === user.id ? user : null,
    },
  } as unknown as PrismaService;
  const jwt = new JwtService({
    secret: 'unit-test-key-not-used-in-production',
    signOptions: { expiresIn: 60 },
  });
  const auth = new AuthService(db, jwt);
  const result = await auth.login(' ADMIN@example.test ', password);
  assert.equal(result.user.email, user.email);
  assert.equal((await auth.verify(result.token)).id, user.id);
  await assert.rejects(auth.login(user.email, 'wrong-password'));
  await assert.rejects(auth.login('missing@example.test', password));
  await assert.rejects(auth.verify('invalid.jwt.token'));
});
