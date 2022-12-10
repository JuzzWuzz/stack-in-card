import { LitElement, PropertyValues, TemplateResult, css, html } from "lit";
import { property, customElement, state } from "lit/decorators.js";
import { LightEffectCardConfig, ExternalLightEffectCardConfig } from "./types";
import { HomeAssistant, LightEntity, LovelaceCard } from "./juzz-ha-helper";
import * as pjson from "../package.json";

export const stopPropagation = (ev) => ev.stopPropagation();

/* eslint no-console: 0 */
console.info(
  `%c  LIGHTEFFECT-CARD  \n%c Version ${pjson.version} `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray",
);

@customElement("lighteffect-card")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class LightEffect extends LitElement {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @property({ attribute: false }) private _entity?: LightEntity;

  @state() private _config?: LightEffectCardConfig;

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
  public setConfig(config: ExternalLightEffectCardConfig): void {
    console.log("setConfig()");
    console.log(config);

    try {
      this._config = {
        ...{
          type: "custom:Basic-card",
          // eslint-disable-next-line camelcase
          hide_if_off: false,
          // eslint-disable-next-line camelcase
          hide_if_no_effects: false,
        },
        ...config,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(`/// LIGHTEFFECT-CARD Invalid Config ///${e.message}`);
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

    // Check if the entity we are tracking has changed
    const entityId = this._config.entity;
    const oldHass = changedProps.get("_hass") as HomeAssistant | undefined;
    if (
      oldHass &&
      this._hass &&
      oldHass.states[entityId] !== this._hass.states[entityId]
    ) {
      console.log("Updating");
      return true;
    }

    // Only update on specific changes
    if (
      changedProps.has("_config") ||
      [
        "_config",
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
    this._entity = this._hass.states[this._config.entity] as LightEntity;
    const effectList = this._entity.attributes.effect_list ?? [];

    try {
      if (
        (this._config.hide_if_off && this._entity.state === "off") ||
        (this._config.hide_if_no_effects && effectList.length === 0)
      ) {
        return html``;
      }
      return html`
        <ha-card>
          ${this._config?.title
            ? html`
                <h1 class="card-header">
                  <div class="name">${this._config.title}</div>
                </h1>
              `
            : html``}
          <div class="card-content">
            <ha-select
              .label=${this._hass.localize("ui.card.light.effect")}
              .value=${this._entity.attributes.effect || ""}
              @selected=${this._effectChanged}
              @closed=${stopPropagation}
            >
              ${effectList.map(
                (effect: string) => html`
                  <mwc-list-item .value=${effect}> ${effect} </mwc-list-item>
                `,
              )}
            </ha-select>
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

  static styles = css`
    ha-select {
      display: block;
    }
  `;

  private _effectChanged(event) {
    if (!this._hass || !this._entity) return;

    const newEffect = event.target.value;

    if (!newEffect || this._entity.attributes.effect === newEffect) return;

    this._hass.callService("light", "turn_on", {
      // eslint-disable-next-line camelcase
      entity_id: this._entity.entity_id,
      effect: newEffect,
    });
  }
}
