import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type AnimationType = 'fadeUp' | 'fadeIn' | 'staggerCards' | 'staggerList' | 'scaleIn' | 'slideRight';

interface AnimationOptions {
  type?: AnimationType;
  delay?: number;
  duration?: number;
  stagger?: number;
  threshold?: number;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
}

export function useAnimateOnMount(ref: React.RefObject<HTMLElement | null>, options: AnimationOptions = {}) {
  const {
    type = 'fadeUp',
    delay = 0,
    duration = 0.7,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const vars: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      scale: 1,
      x: 0,
      duration,
      delay,
      ease: 'power3.out',
      clearProps: 'transform',
    };

    const from: gsap.TweenVars = {};

    switch (type) {
      case 'fadeUp':
        from.opacity = 0;
        from.y = 40;
        break;
      case 'fadeIn':
        from.opacity = 0;
        break;
      case 'scaleIn':
        from.opacity = 0;
        from.scale = 0.9;
        break;
      case 'slideRight':
        from.opacity = 0;
        from.x = -30;
        break;
    }

    // Merge custom from/to
    if (options.from) Object.assign(from, options.from);
    if (options.to) Object.assign(vars, options.to);

    gsap.fromTo(el, from, vars);
  }, [ref, type, delay, duration, options.from, options.to]);
}

export function useStaggerAnimation(
  containerRef: React.RefObject<HTMLElement | null>,
  childrenSelector: string,
  options: AnimationOptions = {}
) {
  const {
    type = 'fadeUp',
    stagger = 0.08,
    delay = 0.1,
    duration = 0.5,
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let children: NodeListOf<Element> | Element[] = [];
    if (childrenSelector === '> div' || childrenSelector === '> *') {
      children = Array.from(container.children);
    } else {
      children = container.querySelectorAll(childrenSelector);
    }
    if (!children.length) return;

    const from: gsap.TweenVars = {};

    switch (type) {
      case 'fadeUp':
        from.opacity = 0;
        from.y = 30;
        break;
      case 'fadeIn':
        from.opacity = 0;
        break;
      case 'scaleIn':
        from.opacity = 0;
        from.scale = 0.92;
        break;
    }

    const vars: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      delay,
      stagger,
      ease: 'power2.out',
    };

    if (options.from) Object.assign(from, options.from);
    if (options.to) Object.assign(vars, options.to);

    gsap.fromTo(children, from, vars);
  }, [containerRef, childrenSelector, type, stagger, delay, duration, options.from, options.to]);
}

export function useRevealAnimation(
  ref: React.RefObject<HTMLElement | null>,
  options: AnimationOptions = {}
) {
  const {
    type = 'fadeUp',
    duration = 0.8,
    threshold = 0.15,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from: gsap.TweenVars = {};

    switch (type) {
      case 'fadeUp':
        from.opacity = 0;
        from.y = 50;
        break;
      case 'scaleIn':
        from.opacity = 0;
        from.scale = 0.9;
        break;
      case 'slideRight':
        from.opacity = 0;
        from.x = -40;
        break;
    }

    const vars: gsap.TweenVars = {
      opacity: 1,
      y: 0,
      scale: 1,
      x: 0,
      duration,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: `top bottom-=${(1 - threshold) * 100}%`,
        toggleActions: 'play none none reverse',
      },
    };

    if (options.from) Object.assign(from, options.from);
    if (options.to) Object.assign(vars, options.to);

    gsap.fromTo(el, from, vars);

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [ref, type, duration, threshold, options.from, options.to]);
}

/** Animate a value on hover (e.g. scale, shadow) */
export function useHoverAnimation(ref: React.RefObject<HTMLElement | null>, scale = 1.03) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleEnter = () => {
      gsap.to(el, { scale, duration: 0.2, ease: 'power2.out' });
    };
    const handleLeave = () => {
      gsap.to(el, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [ref, scale]);
}

/** Animate background gradient shifting */
export function useGradientAnimation(
  ref: React.RefObject<HTMLElement | null>,
  colors: string[] = ['#7c3aed', '#a855f7', '#ec4899']
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(el, {
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
      duration: 4,
      ease: 'sine.inOut',
    });
    tl.to(el, {
      background: `linear-gradient(135deg, ${colors[2]}, ${colors[0]}, ${colors[1]})`,
      duration: 4,
      ease: 'sine.inOut',
    });

    return () => { tl.kill(); };
  }, [ref, colors]);
}