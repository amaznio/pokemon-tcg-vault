import type { CollectionKind, Prisma } from '@prisma/client';
import { prisma } from '../infrastructure/prisma';
import { catalogService } from './catalog-service';

const SYSTEM_COLLECTIONS: Array<{ kind: Exclude<CollectionKind, 'binder'>; name: string }> = [
  { kind: 'owned', name: 'Owned' },
  { kind: 'favorites', name: 'Favorites' },
  { kind: 'wishlist', name: 'Wishlist' },
];

export const collectionService = {
  async ensureSystemCollections(userId: string) {
    await prisma.$transaction(
      SYSTEM_COLLECTIONS.map((collection) =>
        prisma.collection.upsert({
          where: { userId_kind_name: { userId, kind: collection.kind, name: collection.name } },
          create: { userId, kind: collection.kind, name: collection.name },
          update: {},
        }),
      ),
    );
  },

  async listCollections(userId: string) {
    await this.ensureSystemCollections(userId);
    return prisma.collection.findMany({
      where: { userId },
      orderBy: [{ kind: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { items: true } } },
    });
  },

  async createBinder(userId: string, name: string) {
    return prisma.collection.create({
      data: { userId, kind: 'binder', name: name.trim() },
      include: { _count: { select: { items: true } } },
    });
  },

  async updateCollection(userId: string, collectionId: string, data: { name?: string | undefined }) {
    const collection = await this.getOwnedCollection(userId, collectionId);
    if (collection.kind !== 'binder') throw new Error('Only binders can be renamed.');
    return prisma.collection.update({
      where: { id: collectionId },
      data: { ...(data.name !== undefined ? { name: data.name.trim() } : {}) },
      include: { _count: { select: { items: true } } },
    });
  },

  async deleteCollection(userId: string, collectionId: string) {
    const collection = await this.getOwnedCollection(userId, collectionId);
    if (collection.kind !== 'binder') throw new Error('System collections cannot be deleted.');
    return prisma.collection.delete({ where: { id: collectionId } });
  },

  async getOwnedCollection(userId: string, collectionId: string) {
    const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId } });
    if (!collection) throw new Error('Collection not found.');
    return collection;
  },

  async listItems(userId: string, collectionId: string) {
    await this.getOwnedCollection(userId, collectionId);
    return prisma.collectionItem.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'desc' },
      include: {
        card: true,
      },
    });
  },

  async addItem(
    userId: string,
    collectionId: string,
    input: {
      cardId: string;
      quantity?: number | undefined;
      condition?: string | null | undefined;
      finish?: string | null | undefined;
      language?: string | undefined;
      notes?: string | null | undefined;
      purchasePriceCents?: number | null | undefined;
    },
  ) {
    await this.getOwnedCollection(userId, collectionId);
    await catalogService.ensureCardById(input.cardId);
    return prisma.collectionItem.upsert({
      where: { collectionId_cardId: { collectionId, cardId: input.cardId } },
      create: {
        collectionId,
        cardId: input.cardId,
        quantity: input.quantity ?? 1,
        condition: input.condition ?? null,
        finish: input.finish ?? null,
        language: input.language ?? 'en',
        notes: input.notes ?? null,
        purchasePriceCents: input.purchasePriceCents ?? null,
      },
      update: {
        quantity: input.quantity ?? 1,
        condition: input.condition ?? null,
        finish: input.finish ?? null,
        language: input.language ?? 'en',
        notes: input.notes ?? null,
        purchasePriceCents: input.purchasePriceCents ?? null,
      },
      include: { card: true },
    });
  },

  async updateItem(
    userId: string,
    collectionId: string,
    itemId: string,
    input: {
      quantity?: number | undefined;
      condition?: string | null | undefined;
      finish?: string | null | undefined;
      language?: string | undefined;
      notes?: string | null | undefined;
      purchasePriceCents?: number | null | undefined;
    },
  ) {
    await this.getOwnedCollection(userId, collectionId);
    const existing = await prisma.collectionItem.findFirst({ where: { id: itemId, collectionId } });
    if (!existing) throw new Error('Collection item not found.');
    const data: Prisma.CollectionItemUncheckedUpdateInput = {
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.finish !== undefined ? { finish: input.finish } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.purchasePriceCents !== undefined ? { purchasePriceCents: input.purchasePriceCents } : {}),
    };
    return prisma.collectionItem.update({
      where: { id: itemId },
      data,
      include: { card: true },
    });
  },

  async deleteItem(userId: string, collectionId: string, itemId: string) {
    await this.getOwnedCollection(userId, collectionId);
    const existing = await prisma.collectionItem.findFirst({ where: { id: itemId, collectionId } });
    if (!existing) throw new Error('Collection item not found.');
    return prisma.collectionItem.delete({ where: { id: itemId } });
  },
};
