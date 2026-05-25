import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../infrastructure/env';
import { prisma } from '../infrastructure/prisma';

const scrypt = promisify(scryptCallback);
const SYSTEM_COLLECTIONS = [
  { kind: 'owned' as const, name: 'Owned' },
  { kind: 'favorites' as const, name: 'Favorites' },
  { kind: 'wishlist' as const, name: 'Wishlist' },
];

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};

const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
};

const parseCookies = (request: FastifyRequest): Record<string, string> => {
  const header = request.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf('=');
        if (index === -1) return [entry, ''];
        return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))];
      }),
  );
};

const sessionExpiresAt = () => new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

const setSessionCookie = (reply: FastifyReply, token: string, expires: Date) => {
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  reply.header(
    'Set-Cookie',
    `${env.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}${secure}`,
  );
};

const clearSessionCookie = (reply: FastifyReply) => {
  reply.header(
    'Set-Cookie',
    `${env.SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
};

const ensureSystemCollections = async (userId: string) => {
  await prisma.$transaction(
    SYSTEM_COLLECTIONS.map((collection) =>
      prisma.collection.upsert({
        where: { userId_kind_name: { userId, kind: collection.kind, name: collection.name } },
        create: { userId, kind: collection.kind, name: collection.name },
        update: {},
      }),
    ),
  );
};

const createSession = async (userId: string, reply: FastifyReply) => {
  const sessionToken = randomBytes(32).toString('hex');
  const expires = sessionExpiresAt();
  await prisma.session.create({ data: { userId, sessionToken, expires } });
  setSessionCookie(reply, sessionToken, expires);
};

export const authService = {
  async register(input: { email: string; password: string; name?: string | undefined }, reply: FastifyReply) {
    const email = normalizeEmail(input.email);
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name?.trim() || null,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });
    await ensureSystemCollections(user.id);
    await createSession(user.id, reply);
    return user;
  },

  async login(input: { email: string; password: string }, reply: FastifyReply) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      return null;
    }
    await ensureSystemCollections(user.id);
    await createSession(user.id, reply);
    return { id: user.id, email: user.email, name: user.name };
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const token = parseCookies(request)[env.SESSION_COOKIE_NAME];
    if (token) await prisma.session.deleteMany({ where: { sessionToken: token } });
    clearSessionCookie(reply);
  },

  async getSessionUser(request: FastifyRequest) {
    const token = parseCookies(request)[env.SESSION_COOKIE_NAME];
    if (!token) return null;
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: { select: { id: true, email: true, name: true, image: true } } },
    });
    if (!session || session.expires.getTime() <= Date.now()) {
      if (session) await prisma.session.delete({ where: { sessionToken: token } }).catch(() => null);
      return null;
    }
    return session.user;
  },

  async requireUser(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.getSessionUser(request);
    if (!user) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Sign in required.' });
      return null;
    }
    return user;
  },
};
