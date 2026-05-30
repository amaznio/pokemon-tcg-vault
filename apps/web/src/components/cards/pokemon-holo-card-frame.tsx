'use client';

import type { CardSummary } from '@repo/shared';
import {
  useMemo,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
} from 'react';
import { cn } from '@/lib/utils';
import {
  canUsePointerHolo,
  getHoloMetadata,
  type HoloMetadataCard,
} from '@/components/cards/pokemon-holo-metadata';

const HOVER_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type HoloStyle = CSSProperties & {
  '--pointer-x': string;
  '--pointer-y': string;
  '--card-scale': string;
  '--card-opacity': string;
  '--translate-x': string;
  '--translate-y': string;
  '--rotate-x': string;
  '--rotate-y': string;
  '--background-x': string;
  '--background-y': string;
  '--pointer-from-center': string;
  '--pointer-from-top': string;
  '--pointer-from-left': string;
  '--seedx': string;
  '--seedy': string;
  '--cosmosbg': string;
  '--card-alpha-mask': string;
  '--foil'?: string;
  '--mask'?: string;
};

type InteractionStyle = Pick<
  HoloStyle,
  | '--pointer-x'
  | '--pointer-y'
  | '--card-opacity'
  | '--rotate-x'
  | '--rotate-y'
  | '--background-x'
  | '--background-y'
  | '--pointer-from-center'
  | '--pointer-from-top'
  | '--pointer-from-left'
>;

const RESET_INTERACTION_STYLE: InteractionStyle = {
  '--pointer-x': '50%',
  '--pointer-y': '50%',
  '--card-opacity': '0',
  '--rotate-x': '0deg',
  '--rotate-y': '0deg',
  '--background-x': '50%',
  '--background-y': '50%',
  '--pointer-from-center': '0',
  '--pointer-from-top': '0.5',
  '--pointer-from-left': '0.5',
};

const FOCUS_INTERACTION_STYLE: InteractionStyle = {
  '--pointer-x': '28%',
  '--pointer-y': '18%',
  '--card-opacity': '0.85',
  '--rotate-x': '6deg',
  '--rotate-y': '-9deg',
  '--background-x': '44%',
  '--background-y': '38%',
  '--pointer-from-center': '0.75',
  '--pointer-from-top': '0.18',
  '--pointer-from-left': '0.28',
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision = 3) {
  const multiplier = 10 ** precision;

  return Math.round(value * multiplier) / multiplier;
}

function adjust(value: number, min: number, max: number, targetMin: number, targetMax: number) {
  return round(targetMin + ((targetMax - targetMin) * (value - min)) / (max - min));
}

function hashToUnit(value: string, salt: number) {
  let hash = 2166136261 + salt;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function toCssUrl(value: string) {
  return `url("${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

function setInteractionStyle(element: HTMLElement, style: InteractionStyle) {
  Object.entries(style).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

function getCanUsePointerTilt(event: PointerEvent<HTMLElement>) {
  if (typeof window === 'undefined') {
    return false;
  }

  return canUsePointerHolo({
    pointerType: event.pointerType,
    hoverCapable: window.matchMedia(HOVER_POINTER_QUERY).matches,
    reducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,
  });
}

function getPointerInteractionStyle(event: PointerEvent<HTMLElement>): InteractionStyle | null {
  const rect = event.currentTarget.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return null;
  }

  const absoluteX = event.clientX - rect.left;
  const absoluteY = event.clientY - rect.top;
  const percentX = clamp(round((100 / rect.width) * absoluteX));
  const percentY = clamp(round((100 / rect.height) * absoluteY));
  const centerX = percentX - 50;
  const centerY = percentY - 50;
  const pointerFromCenter = clamp(
    Math.sqrt((percentY - 50) * (percentY - 50) + (percentX - 50) * (percentX - 50)) / 50,
    0,
    1,
  );

  return {
    '--pointer-x': `${round(percentX)}%`,
    '--pointer-y': `${round(percentY)}%`,
    '--card-opacity': '1',
    '--rotate-x': `${round(-(centerX / 3.5), 2)}deg`,
    '--rotate-y': `${round(centerY / 3.5, 2)}deg`,
    '--background-x': `${adjust(percentX, 0, 100, 37, 63)}%`,
    '--background-y': `${adjust(percentY, 0, 100, 33, 67)}%`,
    '--pointer-from-center': String(round(pointerFromCenter)),
    '--pointer-from-top': String(round(percentY / 100)),
    '--pointer-from-left': String(round(percentX / 100)),
  };
}

function getInitialStyle(card: HoloMetadataCard, imageUrl: string, foilUrl?: string, maskUrl?: string): HoloStyle {
  const seedX = hashToUnit(card.id, 17);
  const seedY = hashToUnit(card.id, 71);

  return {
    ...RESET_INTERACTION_STYLE,
    '--card-scale': '1',
    '--translate-x': '0px',
    '--translate-y': '0px',
    '--seedx': String(seedX),
    '--seedy': String(seedY),
    '--cosmosbg': `${Math.floor(seedX * 734)}px ${Math.floor(seedY * 1280)}px`,
    '--card-alpha-mask': toCssUrl(imageUrl),
    ...(foilUrl ? { '--foil': toCssUrl(foilUrl) } : {}),
    ...(maskUrl ? { '--mask': toCssUrl(maskUrl) } : {}),
  };
}

export function PokemonHoloCardFrame({
  card,
  imageUrl,
  alt,
  variant,
  className,
  imageClassName,
  foilUrl,
  maskUrl,
}: {
  card: Pick<CardSummary, 'id' | 'name' | 'setId' | 'supertype' | 'subtypes' | 'types' | 'rarity'>;
  imageUrl: string;
  alt: string;
  variant: 'tile' | 'detail';
  className?: string;
  imageClassName?: string;
  foilUrl?: string;
  maskUrl?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingStyleRef = useRef<InteractionStyle | null>(null);
  const pointerEnabledRef = useRef(false);
  const metadata = useMemo(() => getHoloMetadata(card), [card]);
  const initialStyle = useMemo(
    () => getInitialStyle(card, imageUrl, foilUrl, maskUrl),
    [card, imageUrl, foilUrl, maskUrl],
  );

  const resetInteraction = () => {
    const element = rootRef.current;

    if (!element) {
      return;
    }

    pointerEnabledRef.current = false;
    element.classList.remove('interacting');
    setInteractionStyle(element, RESET_INTERACTION_STYLE);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    pointerEnabledRef.current = getCanUsePointerTilt(event);

    if (pointerEnabledRef.current) {
      rootRef.current?.classList.add('interacting');
    } else {
      resetInteraction();
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerEnabledRef.current) {
      return;
    }

    const nextStyle = getPointerInteractionStyle(event);

    if (!nextStyle || typeof window === 'undefined') {
      return;
    }

    pendingStyleRef.current = nextStyle;

    if (rafRef.current !== null) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(() => {
      const element = rootRef.current;
      const pendingStyle = pendingStyleRef.current;

      if (element && pendingStyle) {
        setInteractionStyle(element, pendingStyle);
      }

      pendingStyleRef.current = null;
      rafRef.current = null;
    });
  };

  const handlePointerLeave = () => {
    if (rafRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    pendingStyleRef.current = null;
    resetInteraction();
  };

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    event.currentTarget.classList.add('interacting');
    setInteractionStyle(event.currentTarget, FOCUS_INTERACTION_STYLE);
  };

  const handleBlur = () => {
    resetInteraction();
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'ptcg-holo-card card interactive is-react',
        `ptcg-holo-card--${variant}`,
        metadata.types,
        maskUrl ? 'masked' : null,
        className,
      )}
      data-number={metadata.number}
      data-set={metadata.set}
      data-subtypes={metadata.subtypes}
      data-supertype={metadata.supertype}
      data-rarity={metadata.rarity}
      data-trainer-gallery={String(metadata.trainerGallery)}
      data-testid="pokemon-holo-card"
      style={initialStyle}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="card__translater">
        <div className="card__rotator">
          <div className="card__front">
            <img src={imageUrl} alt={alt} className={cn('card__image', imageClassName)} loading="lazy" />
            <div className="card__shine" />
            <div className="card__glare" />
          </div>
        </div>
      </div>
    </div>
  );
}
