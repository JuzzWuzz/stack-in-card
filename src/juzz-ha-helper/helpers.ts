import { fireEvent } from "./homeassistant/common/dom/fire_event";
import { LovelaceCard } from "./homeassistant/panels/lovelace/types";
import { LovelaceCardConfig } from "custom-card-helpers";

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

/**
 * Ability to create a custom element
 */
export const createCardElement = (cardConfig: LovelaceCardConfig) => {
  const _createError = (error, origConfig) => {
    return _createElement("hui-error-card", {
      type: "error",
      error,
      origConfig,
    });
  };
  const _createElement = (tag, config) => {
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

      // Remove error if element is defined later
      customElements.whenDefined(tag).then(() => {
        clearTimeout(timer);
        fireEvent(element, "ll-rebuild");
      });

      return element;
    }
  };

  let tag = cardConfig.type;
  if (tag.startsWith("custom:")) {
    tag = tag.substring("custom:".length);
  } else {
    tag = `hui-${tag}-card`;
  }

  return _createElement(tag, cardConfig);
};
