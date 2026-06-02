"use client";

import { useEffect } from "react";

/**
 * Global Scroll Reveal Manager (inspired by Aura.build's high-precision transitions).
 * Detects any elements on the page with '.animate-on-scroll' or '.col-anim' and adds
 * the '.animate' class with a micro-delay whenever they cross the viewport.
 */
export default function ScrollReveal() {
  useEffect(() => {
    // Setup the IntersectionObserver with a custom offset for organic reveal flow
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
            // Stop observing once animated to prevent flickering
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -60px 0px", // triggers slightly before entering view
      }
    );

    // Scan the DOM and observe elements
    const elements = document.querySelectorAll(".animate-on-scroll, .col-anim");
    elements.forEach((el) => observer.observe(el));

    // Handle dynamic route changes or content injection (mutation observer fallback)
    const mutationObserver = new MutationObserver(() => {
      const newElements = document.querySelectorAll(
        ".animate-on-scroll:not(.animate), .col-anim:not(.animate)"
      );
      newElements.forEach((el) => observer.observe(el));
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
