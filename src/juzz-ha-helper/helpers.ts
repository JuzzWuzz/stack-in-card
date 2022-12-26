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

export class CardHelper {
  private static instance: CardHelper;
  private _helpers;
  private _helpersPromise;

  /**
   * Init functions
   */

  private constructor() {
    this.loadHelpersPromise();
  }
  private async loadHelpersPromise() {
    this._helpersPromise = this.loadHelpers();
    this._helpers = await this._helpersPromise;
  }
  private async loadHelpers() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).loadCardHelpers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (window as any).loadCardHelpers();
    } else {
      return undefined;
    }
  }

  /**
   * Public Accessors
   */

  public static async getInstance() {
    if (!CardHelper.instance) {
      CardHelper.instance = new CardHelper();
    }

    await CardHelper.instance._helpersPromise;

    return CardHelper.instance;
  }

  /**
   * List of special types that should render row types
   */
  public static SPECIAL_TYPES = new Set([
    "divider",
    "section",
    "text",
    "weblink",
  ]);

  /**
   * Create a element
   */
  public createElement(cardConfig: LovelaceCardConfig) {
    const isCustom = cardConfig.type.startsWith("custom:");
    const isRow = CardHelper.SPECIAL_TYPES.has(cardConfig.type);

    /**
     * This should always use the HA helpers but its been built out in the worst case event
     */
    if (this._helpers) {
      if (isRow) {
        return this._helpers.createRowElement(cardConfig);
      } else {
        return this._helpers.createCardElement(cardConfig);
      }
    } else {
      return this._createElement(cardConfig, isCustom, isRow);
    }
  }

  /**
   * Private functions
   */

  /**
   * Create an error card for when things go wrong
   */
  private _createError(error, origConfig) {
    return this._createElement(
      {
        type: "error",
        error,
        origConfig,
      },
      false,
      false,
    );
  }

  /**
   * Creates an element, this can be a row or card entity depending on the config
   * This system supports a limited set of special types
   */
  private _createElement(config, isCustom: boolean, isRow: boolean) {
    if (!config || typeof config !== "object" || !config.type) {
      return this._createError("No type defined", config);
    }
    console.log(`${config.type} -- ${isCustom} -- ${isRow}`);

    const cardType = config.type;
    const tag = (() => {
      if (isCustom) {
        return cardType.substring("custom:".length);
      } else {
        if (isRow) {
          return `hui-${cardType}-row`;
        } else {
          return `hui-${cardType}-card`;
        }
      }
    })();
    console.log(tag);

    if (customElements.get(tag)) {
      const element = document.createElement(tag);
      try {
        element.setConfig(config);
      } catch (err) {
        if (cardType === "error") {
          return element;
        } else {
          console.error(tag, err);
          return this._createError(err.message, config);
        }
      }
      return element;
    } else {
      const element = this._createError(
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
      if (!isCustom && this._helpers) {
        if (isRow) {
          this._helpers.createRowElement({ type: config.type });
        } else {
          this._helpers.createCardElement({ type: config.type });
        }
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
  }
}
