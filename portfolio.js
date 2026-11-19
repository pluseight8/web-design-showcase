if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.14 });

  document.querySelectorAll("[data-reveal]").forEach((section) => reveal.observe(section));
  document.documentElement.classList.add("motion-ready");
}
