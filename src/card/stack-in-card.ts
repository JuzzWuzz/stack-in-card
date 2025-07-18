import {
  CardHelper,
  HomeAssistant,
  LovelaceCard,
  LovelaceCardConfig,
  LovelaceCardEditor,
  computeCardSize,
  computeRTLDirection,
} from "juzz-ha-helper";
import { LitElement, PropertyValues, TemplateResult, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  CARD_DEFAULT_DISABLE_PADDING,
  CARD_DEFAULT_HORIZONTAL,
  CARD_EDITOR_NAME,
  CARD_NAME,
} from "./const";
import { StackInCardConfig, StackInCardConfigStrict } from "./stack-in-card-config";
import { registerCustomCard } from "../utils/custom-cards";

registerCustomCard({
  type: CARD_NAME,
  name: "Stack In Card",
  description:
    "Allows you to group multiple cards into either a horizontal or vertical space in the same column",
});

@customElement(CARD_NAME)
export class StackInCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./stack-in-card-editor");
    return document.createElement(CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(): Promise<StackInCardConfig> {
    return {
      type: `custom:${CARD_NAME}`,
      cards: [],
    };
  }

  @property({ attribute: false }) private _hass?: HomeAssistant;

  @state() private _config?: StackInCardConfigStrict;

  @state() protected _cards?: LovelaceCard[];
  private _cardsPromise?: Promise<LovelaceCard[]>;

  /**
   * Called whenever the HASS object changes
   * This is done often when states change
   */
  public set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  /**
   * Sets the config for the card
   */
  public setConfig(config: StackInCardConfig) {
    try {
      if (!config.cards || !Array.isArray(config.cards)) {
        throw new Error("Missing cards config");
      }
      this._config = {
        ...{
          type: `custom:${CARD_NAME}`,
          horizontal: CARD_DEFAULT_HORIZONTAL,
          disable_padding: CARD_DEFAULT_DISABLE_PADDING,
        },
        ...config,
      };

      // Init all the cards
      this.initCardsPromise(this._config);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`/// ${CARD_NAME.toUpperCase} Invalid Config ///${e.message}`);
    }
  }

  /**
   * Init the Cards by getting the promise for the cards and awaiting it
   * Once its fulfilled, set the cards property
   */
  private async initCardsPromise(config: StackInCardConfigStrict): Promise<void> {
    this._cardsPromise = this.initCards(config);
    this._cards = await this._cardsPromise;
  }

  /**
   * Return a promise of the array of cards
   */
  private async initCards(config: StackInCardConfig): Promise<LovelaceCard[]> {
    const cardPromises = config.cards.map(async (cardConfig) => {
      // Disable padding for embedded cards as default
      const updatedConfig = (() => {
        if (cardConfig.type === config.type) {
          return {
            ...{ disable_padding: true },
            ...cardConfig,
          };
        } else {
          return cardConfig;
        }
      })();

      // Create the card element
      const card = await this._createCardElement(updatedConfig);

      // The special row styles need padding else they bug out
      if (CardHelper.SPECIAL_TYPES.has(updatedConfig.type)) {
        card.style.paddingLeft = "16px";
        card.style.paddingRight = "16px";
      }

      // Return the styled card
      return card;
    });

    return Promise.all(cardPromises);
  }

  /**
   * Called before update() to compute values needed during the update.
   */
  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);

    if (changedProps.has("_hass") && this._cards?.length) {
      this._cards.forEach((card) => (card.hass = this._hass));
    }
  }

  /**
   * Render the card
   */
  protected render(): TemplateResult {
    if (!this._hass || !this._config || !this._cards) {
      return html``;
    }

    const classes = [this._config.horizontal ? "stack-in-horizontal" : "stack-in-vertical"];
    if (!this._config.disable_padding) {
      if (!this._config.title) {
        classes.push("top-padding");
      }
      classes.push("bottom-padding");
    }

    try {
      return html`
      ${this._config.title
        ? html`<h1 class="card-header">${this._config.title}</h1>`
        : ""}
      <div id="root" class=${classes.join(" ")} dir=${this.hass ? computeRTLDirection(this.hass) : "ltr"}>
        ${this._cards}
      </div>
    `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const errorCard = document.createElement("hui-error-card") as LovelaceCard;
      errorCard.setConfig({
        type: "error",
        error: e.toString(),
        origConfig: this._config,
      });
      return html`${errorCard}`;
    }
  }

  /**
   * Custom CSS for this card
   */
    static get styles() {
      return css`
        :host {
          background: var(
            --ha-card-background,
            var(--card-background-color, white)
          );
          -webkit-backdrop-filter: var(--ha-card-backdrop-filter, none);
          backdrop-filter: var(--ha-card-backdrop-filter, none);
          box-shadow: var(--ha-card-box-shadow, none);
          box-sizing: border-box;
          border-radius: var(--ha-card-border-radius, 12px);
          border-width: var(--ha-card-border-width, 1px);
          border-style: solid;
          border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
          color: var(--primary-text-color);
          display: block;
          transition: all 0.3s ease-out;
          position: relative;
        }
        .card-header {
          color: var(--ha-card-header-color, var(--primary-text-color));
          text-align: var(--ha-stack-title-text-align, start);
          font-family: var(--ha-card-header-font-family, inherit);
          font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl));
          font-weight: var(--ha-font-weight-normal);
          margin-block-start: 0px;
          margin-block-end: 0px;
          letter-spacing: -0.012em;
          line-height: var(--ha-line-height-condensed);
          display: block;
          padding: 24px 16px 16px;
        }
        :host([ispanel]) #root {
          --ha-card-border-radius: var(--restore-card-border-radius);
          --ha-card-border-width: var(--restore-card-border-width);
          --ha-card-box-shadow: var(--restore-card-box-shadow);
        }
        .stack-in-horizontal {
          display: flex;
          height: 100%;
        }
        .stack-in-horizontal > hui-card {
          display: contents;
        }
        .stack-in-horizontal > hui-card > * {
          flex: 1 1 0;
          min-width: 0;
          margin: 0px; // ???
        }
        .stack-in-vertical {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .stack-in-vertical > hui-card > * {
          margin: 0px; // ???
        }
        .top-padding {
          padding-top: var(--ha-card-border-radius, 12px);
        }
        .bottom-padding {
          padding-bottom: var(--ha-card-border-radius, 12px);
        }
      `;
    }

  /**
   * Get the size of the card based on the size of the cards it holds
   */
  public async getCardSize() {
    // If we haven't loaded config or started the card loading, return 0
    if (!this._config || !this._cardsPromise) {
      return 0;
    }

    // If we've waited for the cards to load but they are not set, return 0
    await this._cardsPromise;
    if (!this._cards) {
      return 0;
    }

    // Compute the sizes of the cards
    const sizes = await Promise.all(this._cards.map(computeCardSize));
    if (this._config.horizontal) {
      return Math.max(...sizes);
    } else {
      return sizes.reduce((partialSum, a) => partialSum + a, 0);
    }
  }

  /**
   * Create a card element
   */
  private async _createCardElement(cardConfig: LovelaceCardConfig): Promise<LovelaceCard> {
    const cardHelper = await CardHelper.getInstance();
    const element = cardHelper.createElement(cardConfig);
    if (this._hass) {
      element.hass = this._hass;
    }
    element.addEventListener(
      "ll-rebuild",
      (ev) => {
        ev.stopPropagation();
        this._rebuildCard(element, cardConfig);
      },
      { once: true },
    );
    return element;
  }

  /**
   * Rebuild the card
   */
  private async _rebuildCard(
    cardToReplace: LovelaceCard,
    config: LovelaceCardConfig,
  ): Promise<void> {
    const newCard = await this._createCardElement(config);
    if (cardToReplace.parentElement) {
      cardToReplace.parentElement.replaceChild(newCard, cardToReplace);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._cards = this._cards!.map((curCard) => (curCard === cardToReplace ? newCard : curCard));
  }
}
