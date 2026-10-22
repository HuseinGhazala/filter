/**
 * Updates the product promo block that shows a weight range per size.
 * The block (.wt-product__promo[data-size-weight]) holds the weights list, the
 * size option index and the text template containing [weight].
 */
(function () {
  if (window.__sizeWeightInit) return;
  window.__sizeWeightInit = true;

  function parseWeights(raw) {
    const map = {};
    raw.split(/\r?\n/).forEach((line) => {
      const [keys, weight] = line.split("=");
      if (!weight) return;
      keys.split("|").forEach((key) => {
        map[key.trim().toLowerCase()] = weight.trim();
      });
    });
    return map;
  }

  function update(sectionId, variant) {
    if (!variant) return;
    const root = document.querySelector(`[data-section-id="${sectionId}"]`) || document;
    root.querySelectorAll("[data-size-weight]").forEach((el) => {
      const index = parseInt(el.dataset.sizeIndex, 10);
      if (isNaN(index) || index < 0) return;
      const size = (variant.options[index] || "").trim().toLowerCase();
      const weight = parseWeights(el.dataset.sizeWeights || "")[size];
      if (!weight) {
        el.hidden = true;
        return;
      }
      el.innerHTML = (el.dataset.template || "").replace("[weight]", weight);
      el.hidden = false;
    });
  }

  subscribe(PUB_SUB_EVENTS.variantChange, (e) => {
    update(e.data.sectionId, e.data.variant);
  });
})();
