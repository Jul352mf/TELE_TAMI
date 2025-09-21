"use client";

import { useEffect } from "react";

/**
 * Accessibility enhancement component that adds global accessibility improvements
 */
export default function AccessibilityEnhancer() {
  useEffect(() => {
    // Add focus-visible support for better keyboard navigation
    const addFocusVisible = () => {
      let hadKeyboardEvent = false;
      
      const keyboardThrottleTimeout = 100;
      let keyboardThrottleTimeoutID = 0;

      const detectKeyboard = () => {
        hadKeyboardEvent = true;
        if (keyboardThrottleTimeoutID) {
          clearTimeout(keyboardThrottleTimeoutID);
        }
        keyboardThrottleTimeoutID = window.setTimeout(() => {
          hadKeyboardEvent = false;
        }, keyboardThrottleTimeout);
      };

      const onFocus = (e: FocusEvent) => {
        if (hadKeyboardEvent || (e.target as Element)?.matches(':focus-visible')) {
          (e.target as HTMLElement)?.classList.add('focus-visible');
        }
      };

      const onBlur = (e: FocusEvent) => {
        (e.target as HTMLElement)?.classList.remove('focus-visible');
      };

      document.addEventListener('keydown', detectKeyboard, true);
      document.addEventListener('mousedown', () => { hadKeyboardEvent = false; }, true);
      document.addEventListener('focus', onFocus, true);
      document.addEventListener('blur', onBlur, true);

      return () => {
        document.removeEventListener('keydown', detectKeyboard, true);
        document.removeEventListener('mousedown', () => { hadKeyboardEvent = false; }, true);
        document.removeEventListener('focus', onFocus, true);
        document.removeEventListener('blur', onBlur, true);
      };
    };

    // Add skip link for keyboard users
    const addSkipLink = () => {
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.textContent = 'Skip to main content';
      skipLink.className = `
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground 
        focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring
      `;
      
      document.body.insertBefore(skipLink, document.body.firstChild);

      return () => {
        if (skipLink.parentNode) {
          skipLink.parentNode.removeChild(skipLink);
        }
      };
    };

    // Enhance form labels and descriptions
    const enhanceFormElements = () => {
      // Find all form controls that might need better accessibility
      const formControls = document.querySelectorAll('input, select, textarea, button');
      
      formControls.forEach(control => {
        // Ensure all interactive elements have proper labels or aria-labels
        if (!control.getAttribute('aria-label') && 
            !control.getAttribute('aria-labelledby') && 
            !control.getAttribute('aria-describedby')) {
          
          // Look for associated label
          const id = control.getAttribute('id');
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (!label) {
              // Look for parent label
              const parentLabel = control.closest('label');
              if (!parentLabel) {
                console.warn('Form control missing accessible label:', control);
              }
            }
          }
        }

        // Add keyboard navigation hints for custom components
        if (control.getAttribute('role') === 'button' && !control.hasAttribute('tabindex')) {
          control.setAttribute('tabindex', '0');
        }
      });
    };

    // Add high contrast mode detection and support
    const addHighContrastSupport = () => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      
      const handleContrastChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }
      };

      handleContrastChange(mediaQuery);
      mediaQuery.addEventListener('change', handleContrastChange);

      return () => {
        mediaQuery.removeEventListener('change', handleContrastChange);
      };
    };

    // Add reduced motion support
    const addReducedMotionSupport = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          document.documentElement.classList.add('reduce-motion');
        } else {
          document.documentElement.classList.remove('reduce-motion');
        }
      };

      handleMotionChange(mediaQuery);
      mediaQuery.addEventListener('change', handleMotionChange);

      return () => {
        mediaQuery.removeEventListener('change', handleMotionChange);
      };
    };

    // Announce dynamic content changes to screen readers
    const addLiveRegionSupport = () => {
      let liveRegion = document.getElementById('live-region');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
      }

      // Global function to announce messages
      (window as any).announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (liveRegion) {
          liveRegion.setAttribute('aria-live', priority);
          liveRegion.textContent = message;
          
          // Clear after announcement
          setTimeout(() => {
            if (liveRegion) {
              liveRegion.textContent = '';
            }
          }, 1000);
        }
      };

      return () => {
        if (liveRegion && liveRegion.parentNode) {
          liveRegion.parentNode.removeChild(liveRegion);
        }
        delete (window as any).announceToScreenReader;
      };
    };

    // Initialize all accessibility enhancements
    const cleanupFunctions = [
      addFocusVisible(),
      addSkipLink(),
      addHighContrastSupport(),
      addReducedMotionSupport(),
      addLiveRegionSupport()
    ];

    // Run form enhancements after a short delay to ensure DOM is ready
    const timeout = setTimeout(enhanceFormElements, 100);

    return () => {
      clearTimeout(timeout);
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, []);

  return null;
}

// CSS that should be added to global styles
export const accessibilityStyles = `
  /* Focus styles for keyboard navigation */
  .focus-visible {
    outline: 2px solid hsl(var(--ring)) !important;
    outline-offset: 2px !important;
  }

  /* High contrast mode adjustments */
  .high-contrast {
    --background: 255 255 255;
    --foreground: 0 0 0;
    --border: 0 0 0;
  }

  .high-contrast .dark {
    --background: 0 0 0;
    --foreground: 255 255 255;
    --border: 255 255 255;
  }

  /* Reduced motion */
  .reduce-motion *,
  .reduce-motion *::before,
  .reduce-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Screen reader only content */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sr-only:focus,
  .focus\\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }

  /* Ensure minimum touch target size */
  button, input, select, textarea, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }

  /* Improved focus indicators */
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  [role="button"]:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
`;