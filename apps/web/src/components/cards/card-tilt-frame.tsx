'use client';

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const MAX_TILT_DEGREES = 6;
const HOVER_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type TiltStyle = CSSProperties & {
  '--tilt-x': string;
  '--tilt-y': string;
};

const INITIAL_TILT_STYLE: TiltStyle = {
  '--tilt-x': '0deg',
  '--tilt-y': '0deg',
};

function clampTilt(value: number) {
  return Math.max(-MAX_TILT_DEGREES, Math.min(MAX_TILT_DEGREES, value));
}

function canUsePointerTilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(HOVER_POINTER_QUERY).matches && !window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function CardTiltFrame({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const tiltEnabledRef = useRef(false);

  const resetTilt = () => {
    const element = tiltRef.current;

    if (!element) {
      return;
    }

    element.style.transitionDuration = '';
    element.style.setProperty('--tilt-x', '0deg');
    element.style.setProperty('--tilt-y', '0deg');
  };

  const handlePointerEnter = (event: PointerEvent<HTMLElement>) => {
    tiltEnabledRef.current = canUsePointerTilt(event);

    if (!tiltEnabledRef.current) {
      resetTilt();
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!tiltEnabledRef.current) {
      return;
    }

    const element = tiltRef.current;

    if (!element) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = clampTilt((0.5 - y) * MAX_TILT_DEGREES * 2);
    const rotateY = clampTilt((x - 0.5) * MAX_TILT_DEGREES * 2);

    element.style.transitionDuration = '0ms';
    element.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
    element.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
  };

  const handlePointerLeave = () => {
    tiltEnabledRef.current = false;
    resetTilt();
  };

  return (
    <div
      className={cn(
        '[perspective:900px] [@media(hover:hover)_and_(pointer:fine)]:hover:[--tilt-lift:-2px]',
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onBlur={resetTilt}
    >
      <div
        ref={tiltRef}
        className={cn(
          '[transform:perspective(900px)_rotateX(var(--tilt-x))_rotateY(var(--tilt-y))_translateY(var(--tilt-lift,0px))] [transform-style:preserve-3d] transition-transform duration-150 ease-out will-change-transform motion-reduce:transform-none motion-reduce:transition-none',
          contentClassName,
        )}
        style={INITIAL_TILT_STYLE}
      >
        {children}
      </div>
    </div>
  );
}
