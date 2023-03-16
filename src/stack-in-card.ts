import { LitElement, PropertyValues, TemplateResult, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { property, customElement, state } from "lit/decorators.js";
import { StackInCardConfig } from "./types";
import {
  HomeAssistant,
  LovelaceCard,
  LovelaceCardConfig,
  computeCardSize,
  CardHelper,
} from "juzz-ha-helper";
import * as pjson from "../package.json";

/* eslint no-console: 0 */
console.info(
  `%c  STACK-IN-CARD  \n%c Version ${pjson.version} `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray",
);

// This puts your card into the UI card picker dialog
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards = (window as any).customCards || [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).customCards.push({
  type: "stack-in-card",
  name: "Stack In Card",
  description:
    "Allows you to group multiple cards into either a horizontal or vertical space in the same column",
});

@customElement("stack-in-card")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class StackInCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @state() private _config?: StackInCardConfig;

  @property() protected _cards?: LovelaceCard[];
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
    // console.log("setConfig()");

    try {
      if (!config.cards || !Array.isArray(config.cards)) {
        throw new Error("Missing cards config");
      }
      this._config = {
        ...{
          type: "custom:stack-in-card",
          horizontal: false,
          // eslint-disable-next-line camelcase
          disable_padding: false,
        },
        ...config,
      };

      // Init all the cards
      this.initCardsPromise(this._config);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`/// STACK-IN-CARD Invalid Config ///${e.message}`);
    }
  }

  /**
   * Init the Cards by getting the promise for the cards and awaiting it
   * Once its fulfilled, set the cards property
   */
  private async initCardsPromise(config: StackInCardConfig): Promise<void> {
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
            // eslint-disable-next-line camelcase
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
      } else {
        this.styleCard(card);
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
    // console.log("willUpdate()");

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

    const cardId = this._config.horizontal
      ? "stack-in-horizontal"
      : "stack-in-vertical";
    const classes = ["bottom-padding"];
    if (!this._config.title) {
      classes.push("top-padding");
    }
    if (this._config.disable_padding) {
      classes.length = 0;
    }
    const cardHTML = this._cards
      ? html`<div id=${cardId} class=${classes.join(" ")}>${this._cards}</div>`
      : html``;

    try {
      return html`<ha-card header=${ifDefined(this._config.title)}>
        ${cardHTML}
      </ha-card>`;
    } catch (e) {
      const errorCard = document.createElement(
        "hui-error-card",
      ) as LovelaceCard;
      errorCard.setConfig({
        type: "error",
        error: e.toString(),
        origConfig: this._config,
      });
      return html`${errorCard}`;
    }
  }

  /**
   * Style the given card
   */
  private styleCard(element: LovelaceCard | undefined) {
    const _loopChildNodes = (element: LovelaceCard | undefined) => {
      if (!element) return;
      element.childNodes.forEach((child) => {
        if ((child as LovelaceCard).style) {
          (child as LovelaceCard).style.margin = "0px";
        }
        this.styleCard(child as LovelaceCard);
      });
    };
    const _tryStyleHACard = (maybeHACard: HTMLElement | null): boolean => {
      if (maybeHACard) {
        maybeHACard.style.boxShadow = "none";
        maybeHACard.style.borderRadius = "0";
        maybeHACard.style.border = "none";
        return true;
      }
      return false;
    };
    const _styleCard = (element: LovelaceCard | undefined) => {
      if (!element) return;
      if (element.shadowRoot) {
        if (!_tryStyleHACard(element.shadowRoot.querySelector("ha-card"))) {
          const otherElements =
            element.shadowRoot.getElementById("root") ||
            element.shadowRoot.getElementById("card");
          _loopChildNodes(otherElements as LovelaceCard);
        }
      } else {
        if (typeof element.querySelector === "function") {
          _tryStyleHACard(element.querySelector("ha-card"));
        }
        _loopChildNodes(element);
      }
    };

    if ((element as unknown as LitElement).updateComplete) {
      (element as unknown as LitElement).updateComplete.then(() => {
        _styleCard(element);
      });
    } else {
      _styleCard(element);
    }
  }

  /**
   * Custom CSS for this card
   */
  static styles = css`
    #stack-in-horizontal {
      display: flex;
      height: 100%;
    }
    #stack-in-horizontal > * {
      flex: 1 1 0;
      min-width: 0px;
      margin: 0px;
    }
    #stack-in-vertical {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    #stack-in-vertical > * {
      margin: 0px;
    }
    .top-padding {
      padding-top: var(--ha-card-border-radius, 12px);
    }
    .bottom-padding {
      padding-bottom: var(--ha-card-border-radius, 12px);
    }
  `;

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
  private async _createCardElement(
    cardConfig: LovelaceCardConfig,
  ): Promise<LovelaceCard> {
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
    this._cards = this._cards!.map((curCard) =>
      curCard === cardToReplace ? newCard : curCard,
    );
  }
}
