import { LitElement, PropertyValues, TemplateResult, html } from "lit";
import { property, customElement, state } from "lit/decorators.js";
import { BasicCardConfig, ExternalBasicCardConfig } from "./types";
import { HomeAssistant, LovelaceCard } from "custom-card-helpers";
import * as pjson from "../package.json";

/* eslint no-console: 0 */
console.info(
  `%c  BASIC-CARD  \n%c Version ${pjson.version} `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray",
);

@customElement("Basic-card")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class BasicCard extends LitElement {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @state() private _config?: BasicCardConfig;

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
  public setConfig(config: ExternalBasicCardConfig): void {
    console.log("setConfig()");
    console.log(config);

    try {
      this._config = {
        type: "custom:Basic-card",
        entity: config.entity,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`/// BASIC-CARD Invalid Config ///${e.message}`);
    }
  }

  /**
   * Called to determine whether an update cycle is required.
   * Use the entity item to check if the `changedProps` contains our element and return `true`
   */
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!changedProps.get("_hass")) console.log(changedProps);

    if (!this._config) {
      return false;
    }

    // Only update on specific changes
    if (
      changedProps.has("_config") ||
      [
        "_config",
        "_date",
        "_startDate",
        "_endDate",
      ].some((key) => changedProps.has(key))
    ) {
      console.log("Updating");
      return true;
    } else {
      return false;
    }
  }

  /**
   * Called whenever the component’s update finishes and the element's DOM has been updated and rendered.
   */
  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    console.log("updated()");

    // Bail if we have an invalid state
    if (!this._config || !this._hass) {
      return;
    }
  }

  /**
   * Render the card
   */
  protected render(): TemplateResult {
    if (!this._hass || !this._config) return html``;
    const entityState = this._hass.states[this._config.entity];

    try {
      return html`
        <ha-card>
          <div class="row">
            <div class="label">
              ${entityState.attributes.friendly_name}: ${entityState.state}
            </div>
          </div>
        </ha-card>
      `;
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
}
