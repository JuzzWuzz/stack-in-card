import { HassEntity } from "home-assistant-js-websocket";
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
// (window as any).customCards = (window as any).customCards || [];
// (window as any).customCards.push({
//   type: 'wiser-zigbee-card',
//   name: 'Wiser Zigbee Card',
//   description: 'A card to display Wiser Zigbee network between devices',
// });

@customElement("stack-in-card")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class StackInCard extends LitElement implements LovelaceCard {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @property({ attribute: false }) private _entity?: HassEntity;

  @state() private _config?: StackInCardConfig;

  @property() protected _cards?;

  private _initialSetupComplete = false;

  /**
   * Invoked when the component is added to the document's DOM.
   */
  public connectedCallback(): void {
    super.connectedCallback();
    // console.log("connectedCallback()");

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
    // console.log("disconnectedCallback()");
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
  public async setConfig(config: StackInCardConfig) {
    console.log("setConfig()");
    // console.log(config);

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
    console.log("setConfig() -- Done");
  }

  protected willUpdate(changedProps: PropertyValues): void {
    // if (changedProps.has("_helpers")) {
    //   console.log("Got the helpers now");
    //   this.createCards();
    // }
    // if (changedProps.has("_cards")) {
    //   console.log("Got the cards now");
    //   for (const element of this._cards) {
    //     this.waitForChildren(element);
    //   }
    // }
    if (changedProps.has("_hass") && this._cards?.length) {
      console.log("Got a new HASS");
      this._cards.forEach((card) => (card.hass = this._hass));
    }
  }

  /**
   * Called whenever the component’s update finishes and the element's DOM has been updated and rendered.
   */
  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    console.log("updated()");
    console.log(changedProps);

    // Bail if we have an invalid state
    if (!this._config || !this._hass || !this._cards) {
      return;
    }
    for (const element of this._cards) {
      this.waitForChildren(element);
    }
  }

  /**
   * Render the card
   */
  protected render(): TemplateResult {
    if (!this._hass || !this._config || !this._cards) {
      return html``;
    }

    // this._entity = this._hass.states[this._config.entity];
    const rootStyle = this._config.horizontal
      ? "stack-in-horizontal"
      : "stack-in-vertical";
    const cardHTML = this._cards
      ? html`<div id=${rootStyle}>${this._cards}</div>`
      : html``;
    const noHeaderSpacer = !this._config.title
      ? html`<div style="margin-top: 12px;"></div>`
      : html``;
    const cardStyle = this._config.setStyles
      ? "box-shadow: none; border-radius: 0; border: none;"
      : undefined;

    try {
      return html`<ha-card header=${ifDefined(this._config.title)}>
        <!-- ${noHeaderSpacer}  -->
        <!-- style=${ifDefined(cardStyle)} -->
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
  protected styleCard(element: LovelaceCard | undefined) {
    if (!element) return;
    console.log(element);
    if (element.shadowRoot) {
      console.log("Has Shadow Root");
      console.log(element.shadowRoot);
      console.log(element.shadowRoot.innerHTML);
      console.log(element.querySelector("ha-card"));
      if (!this.tryStyleHACard(element.shadowRoot.querySelector("ha-card"))) {
        console.log("Has Shadow Root > Not HA Card");
        this.loopChildNodes(
          (
            element.shadowRoot.getElementById("root") ||
            element.shadowRoot.getElementById("card")
          )?.childNodes,
        );
      }
    } else {
      console.log("No Shadow Root");
      if (typeof element.querySelector === "function") {
        this.tryStyleHACard(element.querySelector("ha-card"));
      }
      this.loopChildNodes(element.childNodes);
    }
  }
  private tryStyleHACard(maybeHACard: HTMLElement | null): boolean {
    if (maybeHACard) {
      console.log("Has HA Card");
      maybeHACard.style.boxShadow = "none";
      maybeHACard.style.borderRadius = "0";
      maybeHACard.style.border = "none";
      return true;
    }
    console.log("Not HA Card");
    return false;
  }
  private loopChildNodes(childNodes: NodeListOf<ChildNode> | undefined) {
    console.log("Looping Children");
    if (!childNodes) return;
    childNodes.forEach((child) => {
      console.log(child);
      if ((child as LovelaceCard).style) {
        (child as LovelaceCard).style.margin = "0px";
      }
      this.waitForChildren(child as LovelaceCard);
    });
  }
  private waitForChildren(element: LovelaceCard | undefined) {
    if ((element as unknown as LitElement).updateComplete) {
      (element as unknown as LitElement).updateComplete.then(() => {
        this.styleCard(element);
      });
    } else {
      this.styleCard(element);
    }
  }

  static styles = css`
    #stack-in-horizontal {
      display: flex;
      height: 100%;
    }
    #stack-in-horizontal > * {
      flex: 1 1 0;
      min-width: 0px;
      /* margin-top: 0px;
      margin-bottom: var(--ha-card-border-radius, 12px);
      margin-left: 4px;
      margin-right: 4px; */
      margin: 0px;
    }
    /* #stack-in-horizontal > *:first-child {
      margin-left: 0px;
    }
    #stack-in-horizontal > *:last-child {
      margin-right: 0px;
    } */
    #stack-in-vertical {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    #stack-in-vertical > * {
      /* margin-top: 4px;
      margin-bottom: 4px;
      margin-left: 0px;
      margin-right: 0px; */
      margin: 0px;
    }
    /* #stack-in-vertical > *:first-child {
      margin-top: 0px;
    }
    #stack-in-vertical > *:last-child {
      margin-bottom: var(--ha-card-border-radius, 12px);
    } */
  `;

  /**
   * Get the size of the card based on the size of the cards it holds
   */
  public async getCardSize() {
    console.log(`Got size: ${this._cards} -- ${this._config}`);
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
