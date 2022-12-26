/* eslint-disable @typescript-eslint/no-unused-vars */
import { fireEvent } from "./homeassistant/common/dom/fire_event";
import { LovelaceCard } from "./homeassistant/panels/lovelace/types";
import { LovelaceCardConfig } from "./homeassistant/data/lovelace";

/**
 * Comes from HA: src\panels\lovelace\common\compute-card-size.ts
 */
export const computeCardSize = (
  card: LovelaceCard,
): number | Promise<number> => {
  if (typeof card.getCardSize === "function") {
    return card.getCardSize();
  }
  if (customElements.get(card.localName)) {
    return 1;
  }
  return customElements
    .whenDefined(card.localName)
    .then(() => computeCardSize(card))
    .catch(() => 1);
};

// ########################################
// Section: Creating Cards
// ########################################

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HELPERS = (window as any).loadCardHelpers
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).loadCardHelpers()
  : undefined;

export const SPECIAL_TYPES = new Set([
  "divider",
  "section",
  "text",
  "weblink",
]);

/**
 * Ability to create a custom element
 */
export const createCardElement = (cardConfig: LovelaceCardConfig) => {
  const _createError = (error, origConfig) => {
    return _createElement(
      "hui-error-card",
      {
        type: "error",
        error,
        origConfig,
      },
      false,
      false,
    );
  };
  const _createElement = (tag, config, isCustom: boolean, isRow: boolean) => {
    if (!cardConfig || typeof cardConfig !== "object" || !cardConfig.type) {
      return _createError("No type defined", cardConfig);
    }
    if (customElements.get(tag)) {
      const element = document.createElement(tag);
      try {
        element.setConfig(config);
      } catch (err) {
        if (tag === "hui-error-card") {
          return element;
        } else {
          console.error(tag, err);
          return _createError(err.message, config);
        }
      }
      return element;
    } else {
      const element = _createError(
        `Custom element doesn't exist: ${tag}.`,
        config,
      );
      // Custom elements are required to have a - in the name
      if (!tag.includes("-")) {
        return element;
      }
      element.style.display = "None";
      const timer = window.setTimeout(() => {
        element.style.display = "";
      }, 2000);

      // If this is not a custom element lets try get it loaded by creating a fake item
      if (!isCustom && HELPERS) {
        HELPERS.then((helpers) => {
          if (isRow) {
            helpers.createRowElement({ type: cardConfig.type });
          } else {
            helpers.createCardElement({ type: cardConfig.type });
          }
        });
      }

      // Remove error if element is defined later
      customElements.whenDefined(tag).then(() => {
        clearTimeout(timer);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fireEvent(element, "ll-rebuild");
      });

      return element;
    }
  };

  let tag = cardConfig.type;
  let isCustom = false;
  let isRow = false;
  if (tag.startsWith("custom:")) {
    tag = tag.substring("custom:".length);
    isCustom = true;
  } else {
    if (SPECIAL_TYPES.has(tag)) {
      tag = `hui-${tag}-row`;
      isRow = true;
    } else {
      tag = `hui-${tag}-card`;
    }
  }

  return _createElement(tag, cardConfig, isCustom, isRow);
};
