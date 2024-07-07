import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiCodeBraces,
  mdiDelete,
  mdiListBoxOutline,
  mdiPlus,
} from "@mdi/js";
import { CSSResultGroup, LitElement, css, html, nothing } from "lit";
import { CARD_EDITOR_NAME, CARD_DEFAULT_HORIZONTAL, CARD_DEFAULT_DISABLE_PADDING } from "./const";
import {
  ConfigChangedEvent,
  EditorTarget,
  GUIModeChangedEvent,
  HASSDomEvent,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceCardEditor,
  LovelaceConfig,
  fireEvent,
} from "juzz-ha-helper";
import { customElement, property, query, state } from "lit/decorators.js";
import { StackInCardConfig, StackInCardConfigStruct } from "./stack-in-card-config";
import { assert } from "superstruct";

export const configElementStyle = css``;

@customElement(CARD_EDITOR_NAME)
export class StackInCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @property({ attribute: false }) public lovelace?: LovelaceConfig;

  @state() private _config?: StackInCardConfig;

  @state() protected _selectedCard = 0;

  @state() protected _GUImode = true;

  @state() protected _guiModeAvailable? = true;

  @query("hui-card-element-editor") protected _cardEditorElement;

  /**
   * Called whenever the HASS object changes
   * This is done often when states change
   */
  public set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  public setConfig(config: StackInCardConfig): void {
    assert(config, StackInCardConfigStruct);
    this._config = config;
  }

  public focusYamlEditor() {
    this._cardEditorElement?.focusYamlEditor();
  }

  protected render() {
    if (!this._hass || !this._config) {
      return nothing;
    }

    const selected = this._selectedCard!;
    const numcards = this._config.cards.length;

    const isGuiMode = !this._cardEditorElement || this._GUImode;

    return html`
      <div class="card-config">
        <ha-textfield
          .label="${this._hass.localize(
            "ui.panel.lovelace.editor.card.generic.title",
          )} (${this._hass.localize("ui.panel.lovelace.editor.card.config.optional")})"
          .value=${this._config.title || ""}
          .configValue=${"title"}
          @input=${this._handleConfigChanged}
        ></ha-textfield>
        <div class="side-by-side">
          <ha-formfield alignEnd .label=${"Horizontal"}>
            <ha-switch
              .checked=${this._config!.horizontal}
              .configValue=${"horizontal"}
              @change=${this._handleConfigChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield alignEnd spaceBetween .label=${"Disable Padding"}>
            <ha-switch
              .checked=${this._config!.disable_padding}
              .configValue=${"disable_padding"}
              @change=${this._handleConfigChanged}
            ></ha-switch>
          </ha-formfield>
        </div>
        <h3>Cards (Required)</h3>
        <div class="toolbar">
          <paper-tabs scrollable .selected=${selected} @iron-activate=${this._handleSelectedCard}>
            ${this._config.cards.map((_card, i) => html` <paper-tab> ${i + 1} </paper-tab> `)}
          </paper-tabs>
          <paper-tabs
            id="add-card"
            .selected=${selected === numcards ? "0" : undefined}
            @iron-activate=${this._handleSelectedCard}
          >
            <paper-tab>
              <ha-svg-icon .path=${mdiPlus}></ha-svg-icon>
            </paper-tab>
          </paper-tabs>
        </div>
        <div id="editor">
          ${selected < numcards
            ? html`
                <div id="card-options">
                  <ha-icon-button
                    class="gui-mode-button"
                    @click=${this._toggleMode}
                    .disabled=${!this._guiModeAvailable}
                    .label=${this._hass!.localize(
                      !this._cardEditorElement || this._GUImode
                        ? "ui.panel.lovelace.editor.edit_card.show_code_editor"
                        : "ui.panel.lovelace.editor.edit_card.show_visual_editor",
                    )}
                    .path=${isGuiMode ? mdiCodeBraces : mdiListBoxOutline}
                  ></ha-icon-button>

                  <ha-icon-button
                    .disabled=${selected === 0}
                    .label=${this._hass!.localize("ui.panel.lovelace.editor.edit_card.move_before")}
                    .path=${mdiArrowLeft}
                    @click=${this._handleMove}
                    .move=${-1}
                  ></ha-icon-button>

                  <ha-icon-button
                    .label=${this._hass!.localize("ui.panel.lovelace.editor.edit_card.move_after")}
                    .path=${mdiArrowRight}
                    .disabled=${selected === numcards - 1}
                    @click=${this._handleMove}
                    .move=${1}
                  ></ha-icon-button>

                  <ha-icon-button
                    .label=${this._hass!.localize("ui.panel.lovelace.editor.edit_card.delete")}
                    .path=${mdiDelete}
                    @click=${this._handleDeleteCard}
                  ></ha-icon-button>
                </div>
                <hui-card-element-editor
                  .hass=${this._hass}
                  .value=${this._config.cards[this._selectedCard]}
                  .lovelace=${this.lovelace}
                  .configValue=${"cards"}
                  @config-changed=${this._handleConfigChanged}
                  @GUImode-changed=${this._handleGUIModeChanged}
                ></hui-card-element-editor>
              `
            : html`
                <hui-card-picker
                  .hass=${this._hass}
                  .lovelace=${this.lovelace}
                  @config-changed=${this._handleCardPicked}
                ></hui-card-picker>
              `}
        </div>
      </div>
    `;
  }

  protected _handleSelectedCard(ev) {
    if (ev.target.id === "add-card") {
      this._selectedCard = this._config!.cards.length;
      return;
    }
    this._setMode(true);
    this._guiModeAvailable = true;
    this._selectedCard = parseInt(ev.detail.selected, 10);
  }

  protected _handleConfigChanged(ev: HASSDomEvent<ConfigChangedEvent>) {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const target = ev.target! as EditorTarget;
    const configValue = target.configValue;
    const value = target.checked !== undefined ? target.checked : target.value;

    // Ignore updates if the data is the same
    if (
      (configValue === "title" && value === this._config.title) ||
      (configValue === "horizontal" && value === this._config.horizontal) ||
      (configValue === "disable_padding" && value === this._config.disable_padding)
    ) {
      return;
    }

    if (configValue === "cards") {
      const cards = [...this._config.cards];
      cards[this._selectedCard] = ev.detail.config as LovelaceCardConfig;
      this._config = { ...this._config, cards };
      this._guiModeAvailable = ev.detail.guiModeAvailable;
    } else if (configValue) {
      if (
        value === "" ||
        (configValue === "horizontal" && value === CARD_DEFAULT_HORIZONTAL) ||
        (configValue === "disable_padding" && value === CARD_DEFAULT_DISABLE_PADDING)
      ) {
        this._config = { ...this._config };
        delete this._config[configValue!];
      } else {
        this._config = {
          ...this._config,
          [configValue]: value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }

  protected _handleCardPicked(ev) {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }
    const config = ev.detail.config;
    const cards = [
      ...this._config.cards,
      config,
    ];
    this._config = { ...this._config, cards };
    fireEvent(this, "config-changed", { config: this._config });
  }

  // Others

  protected _handleDeleteCard() {
    if (!this._config) {
      return;
    }
    const cards = [...this._config.cards];
    cards.splice(this._selectedCard, 1);
    this._config = { ...this._config, cards };
    this._selectedCard = Math.max(0, this._selectedCard - 1);
    fireEvent(this, "config-changed", { config: this._config });
  }

  protected _handleMove(ev: Event) {
    if (!this._config) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const move = (ev.currentTarget as any).move;
    const source = this._selectedCard;
    const target = source + move;
    const cards = [...this._config.cards];
    const card = cards.splice(this._selectedCard, 1)[0];
    cards.splice(target, 0, card);
    this._config = {
      ...this._config,
      cards,
    };
    this._selectedCard = target;
    fireEvent(this, "config-changed", { config: this._config });
  }

  protected _handleGUIModeChanged(ev: HASSDomEvent<GUIModeChangedEvent>): void {
    ev.stopPropagation();
    this._GUImode = ev.detail.guiMode;
    this._guiModeAvailable = ev.detail.guiModeAvailable;
  }

  protected _toggleMode(): void {
    this._cardEditorElement?.toggleMode();
  }

  protected _setMode(value: boolean): void {
    this._GUImode = value;
    if (this._cardEditorElement) {
      this._cardEditorElement!.GUImode = value;
    }
  }

  static get styles(): CSSResultGroup {
    return [
      configElementStyle,
      css`
        .card-config {
          /* Cancels overlapping Margins for HAForm + Card Config options */
          overflow: auto;
        }
        ha-formfield {
          display: flex;
          height: 56px;
          align-items: center;
          --mdc-typography-body2-font-size: 1em;
        }
        ha-switch {
          padding: 16px 6px;
        }
        .side-by-side {
          display: flex;
          align-items: flex-end;
        }
        .side-by-side > * {
          flex: 1;
          padding-right: 8px;
        }
        .side-by-side > *:last-child {
          flex: 1;
          padding-right: 0;
        }
        .suffix {
          margin: 0 8px;
        }
        hui-action-editor,
        ha-select,
        ha-textfield,
        ha-icon-picker {
          margin-top: 8px;
          display: block;
        }
        .toolbar {
          display: flex;
          --paper-tabs-selection-bar-color: var(--primary-color);
          --paper-tab-ink: var(--primary-color);
        }
        paper-tabs {
          display: flex;
          font-size: 14px;
          flex-grow: 1;
        }
        #add-card {
          max-width: 32px;
          padding: 0;
        }

        #card-options {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        #editor {
          border: 1px solid var(--divider-color);
          padding: 12px;
        }
        @media (max-width: 450px) {
          #editor {
            margin: 0 -12px;
          }
        }

        .gui-mode-button {
          margin-right: auto;
        }
      `,
    ];
  }
}
