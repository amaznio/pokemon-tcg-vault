import type { CardSummary } from '@repo/shared';

export type HoloMetadataCard = Pick<
  CardSummary,
  'id' | 'setId' | 'supertype' | 'subtypes' | 'types' | 'rarity'
>;

const RARITY_ALIASES = new Map<string, string>([
  ['ultra rare', 'rare ultra'],
  ['hyper rare', 'rare rainbow'],
  ['illustration rare', 'rare ultra'],
  ['special illustration rare', 'rare secret'],
]);

const TRAINER_GALLERY_PREFIX = /^[tg]g/i;

export function normalizeHoloToken(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export function normalizeHoloList(values: string[] | null | undefined) {
  return values?.map(normalizeHoloToken).filter(Boolean) ?? [];
}

export function normalizeHoloRarity(rarity: string | null | undefined) {
  const normalized = normalizeHoloToken(rarity);

  return RARITY_ALIASES.get(normalized) ?? normalized;
}

export function getCollectorNumber(cardId: string) {
  return cardId.split('-').at(-1)?.toLowerCase() ?? '';
}

export function isTrainerGalleryCard(card: Pick<HoloMetadataCard, 'id'>, collectorNumber = getCollectorNumber(card.id)) {
  return (
    TRAINER_GALLERY_PREFIX.test(collectorNumber) ||
    card.id === 'swshp-SWSH076' ||
    card.id === 'swshp-SWSH077'
  );
}

export function getHoloMetadata(card: HoloMetadataCard) {
  const collectorNumber = getCollectorNumber(card.id);

  return {
    number: collectorNumber,
    set: normalizeHoloToken(card.setId),
    supertype: normalizeHoloToken(card.supertype),
    subtypes: normalizeHoloList(card.subtypes).join(' '),
    types: normalizeHoloList(card.types),
    rarity: normalizeHoloRarity(card.rarity),
    trainerGallery: isTrainerGalleryCard(card, collectorNumber),
  };
}

export function canUsePointerHolo({
  pointerType,
  hoverCapable,
  reducedMotion,
}: {
  pointerType: string;
  hoverCapable: boolean;
  reducedMotion: boolean;
}) {
  return pointerType === 'mouse' && hoverCapable && !reducedMotion;
}
