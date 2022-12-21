import { LitElement, PropertyValues, TemplateResult, css, html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { property, customElement, state } from "lit/decorators.js";
import { StackInCardConfig } from "./types";
import {
  HomeAssistant,
  LovelaceCard,
  LovelaceCardConfig,
  computeCardSize,
  createCardElement,
} from "./juzz-ha-helper";
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

  @property() protected _cards?;

  private _initialSetupComplete = false;

  /**
   * Invoked when the component is added to the document's DOM.
   */
  public connectedCallback(): void {
    super.connectedCallback();
    console.log("connectedCallback()");

    // Init the card
    if (this._config && !this._initialSetupComplete) {
      this._initialSetupComplete = true;
    }
  }

  /**
   * Invoked when the component is removed from the document's DOM.
   */
  public disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log("disconnectedCallback()");
  }

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
    console.log("setConfig()");

    try {
      if (!config.cards || !Array.isArray(config.cards)) {
        throw new Error("Missing cards config");
      }
      this._config = {
        ...{
          type: "custom:stack-in-card",
          horizontal: false,
          setStyles: false,
        },
        ...config,
      };

      this._cards = config.cards.map((cardConfig) =>
        this._createCardElement(cardConfig),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`/// STACK-IN-CARD Invalid Config ///${e.message}`);
    }
  }

  /**
   * Called before update() to compute values needed during the update.
   */
  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    console.log("willUpdate()");

    if (changedProps.has("_hass") && this._cards?.length) {
      this._cards.forEach((card) => (card.hass = this._hass));
    }
  }

  /**
   * Called whenever the component’s update finishes and the element's DOM has been updated and rendered.
   */
  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    console.log("updated()");

    // Bail if we have an invalid state
    if (!this._config || !this._hass || !this._cards) {
      return;
    }
    for (const element of this._cards) {
      this.styleCard(element);
    }
  }

  /**
   * Render the card
   */
  protected render(): TemplateResult {
    if (!this._hass || !this._config || !this._cards) {
      return html``;
    }

    const rootStyle = this._config.horizontal
      ? "stack-in-horizontal"
      : "stack-in-vertical";
    const extraClass = !this._config.title ? "top-padding" : undefined;
    const cardHTML = this._cards
      ? html`<div id=${rootStyle} class=${ifDefined(extraClass)}>
          ${this._cards}
        </div>`
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
      padding-bottom: var(--ha-card-border-radius, 12px);
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
      padding-bottom: var(--ha-card-border-radius, 12px);
    }
    #stack-in-vertical > * {
      margin: 0px;
    }
    .top-padding {
      padding-top: 12px;
    }
  `;

  /**
   * Get the size of the card based on the size of the cards it holds
   */
  public async getCardSize() {
    if (!this._config || !this._cards) {
      return 0;
    }

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
  private _createCardElement(cardConfig: LovelaceCardConfig) {
    const element = createCardElement(cardConfig);
    element.hass = this._hass;
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
  private _rebuildCard(
    cardToReplace: LovelaceCard,
    config: LovelaceCardConfig,
  ): void {
    const newCard = this._createCardElement(config);
    if (cardToReplace.parentElement) {
      cardToReplace.parentElement.replaceChild(newCard, cardToReplace);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this._cards = this._cards!.map((curCard) =>
      curCard === cardToReplace ? newCard : curCard,
    );
  }
}
