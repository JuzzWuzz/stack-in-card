import {
  mdiCodeBraces,
  mdiContentCopy,
  mdiContentCut,
  mdiDelete,
  mdiListBoxOutline,
  mdiPlus,
} from "@mdi/js";
import deepClone from "deep-clone-simple";
import {
  CardHelper,
  ConfigChangedEvent,
  GUIModeChangedEvent,
  HASSDomEvent,
  HaFormSchema,
  SchemaUnion,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceCardEditor,
  LovelaceConfig,
  fireEvent,
  storage
} from "juzz-ha-helper";
import { CSSResultGroup, LitElement, TemplateResult, css, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { assert } from "superstruct";
import { keyed } from "lit/directives/keyed.js";

import { CARD_DEFAULT_DISABLE_PADDING, CARD_DEFAULT_HORIZONTAL, CARD_EDITOR_NAME } from "./const";
import { SCHEMA, StackInCardConfig, StackInCardConfigStruct } from "./stack-in-card-config";

@customElement(CARD_EDITOR_NAME)
export class StackInCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) private _hass?: HomeAssistant;

  @property({ attribute: false }) public lovelace?: LovelaceConfig;

  @storage({
    key: "dashboardCardClipboard",
    state: false,
    subscribe: false,
    storage: "sessionStorage",
  })
  protected _clipboard?: LovelaceCardConfig;

  @state() private initialized = false;

  @state() private _config?: StackInCardConfig;

  @state() protected _selectedCard = 0;

  @state() protected _GUImode = true;

  @state() protected _guiModeAvailable? = true;

  protected _keys = new Map<string, string>();

  protected _schema: readonly HaFormSchema[] = SCHEMA;

  @query("hui-card-element-editor") protected _cardEditorElement;

  /**
   * Called whenever the HASS object changes
   * This is done often when states change
   */
  public set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  public connectedCallback() {
    super.connectedCallback();
    if (this.initialized) {
      return;
    }

    this.initialize().then(() => {
      this.initialized = true;
    });
  }

  private async initialize() {
    const cardHelper = await CardHelper.getInstance();
    await cardHelper.loadHuiCardPicker();
    this.initialized = true;
  }

  public setConfig(config: StackInCardConfig): void {
    assert(config, StackInCardConfigStruct);
    this._config = config;
  }

  public focusYamlEditor() {
    this._cardEditorElement?.focusYamlEditor();
  }

  protected formData(): object {
    return this._config!;
  }

  protected render(): TemplateResult {
    if (!this._hass || !this._config) {
      return html``;
    }

    const selected = this._selectedCard!;
    const numcards = this._config.cards.length;

    const isGuiMode = !this._cardEditorElement || this._GUImode;

    return html`
      <ha-form
        .hass=${this._hass}
        .data=${this.formData()}
        .schema=${this._schema}
        .computeLabel=${this._computeLabelCallback}
        @value-changed=${this._valueChanged}
      ></ha-form>
      <div class="card-config">
        <div class="toolbar">
          <sl-tab-group @sl-tab-show=${this._handleSelectedCard}>
            ${this._config.cards.map(
              (_card, i) =>
                html`<sl-tab slot="nav" .panel=${i} .active=${i === selected}>
              ${i + 1}
              </sl-tab>`
               )}
          </sl-tab-group>
          <ha-icon-button
            @click=${this._handleAddCard}
            .path=${mdiPlus}
          ></ha-icon-button>
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
                      this._GUImode
                        ? "ui.panel.lovelace.editor.edit_card.show_code_editor"
                        : "ui.panel.lovelace.editor.edit_card.show_visual_editor",
                    )}
                    .path=${isGuiMode ? mdiCodeBraces : mdiListBoxOutline}
                  ></ha-icon-button>

                  <ha-icon-button-arrow-prev
                    .disabled=${selected === 0}
                    .label=${this._hass!.localize("ui.panel.lovelace.editor.edit_card.move_before")}
                    @click=${this._handleMove}
                    .move=${-1}
                  ></ha-icon-button-arrow-prev>

                  <ha-icon-button-arrow-next
                    .label=${this._hass!.localize("ui.panel.lovelace.editor.edit_card.move_after")}
                    .disabled=${selected === numcards - 1}
                    @click=${this._handleMove}
                    .move=${1}
                  ></ha-icon-button-arrow-next>

                  <ha-icon-button
                    .label=${this._hass!.localize(
                      "ui.panel.lovelace.editor.edit_card.copy"
                    )}
                    .path=${mdiContentCopy}
                    @click=${this._handleCopyCard}
                  ></ha-icon-button>

                  <ha-icon-button
                    .label=${this._hass!.localize(
                      "ui.panel.lovelace.editor.edit_card.cut"
                    )}
                    .path=${mdiContentCut}
                    @click=${this._handleCutCard}
                  ></ha-icon-button>

                  <ha-icon-button
                    .label=${this._hass!.localize("ui.panel.lovelace.editor.edit_card.delete")}
                    .path=${mdiDelete}
                    @click=${this._handleDeleteCard}
                  ></ha-icon-button>
                </div>
                ${keyed(
                  this._getKey(this._config.cards, selected),
                  CardHelper.SPECIAL_TYPES.has(this._config.cards[selected].type)
                  ? html`
                      <hui-row-element-editor
                        .hass=${this._hass}
                        .value=${this._config.cards[selected]}
                        .lovelace=${this.lovelace}
                        @config-changed=${this._handleConfigChanged}
                        @GUImode-changed=${this._handleGUIModeChanged}
                      ></hui-row-element-editor>
                    `
                  : html`
                      <hui-card-element-editor
                        .hass=${this._hass}
                        .value=${this._config.cards[selected]}
                        .lovelace=${this.lovelace}
                        @config-changed=${this._handleConfigChanged}
                        @GUImode-changed=${this._handleGUIModeChanged}
                      ></hui-card-element-editor>
                    `
                )}
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

  private _getKey(cards: LovelaceCardConfig[], index: number): string {
    const key = `${index}-${cards.length}`;
    if (!this._keys.has(key)) {
      this._keys.set(key, Math.random().toString());
    }

    return this._keys.get(key)!;
  }

  protected async _handleAddCard() {
    this._selectedCard = this._config!.cards.length;
    await this.updateComplete;
    (this.renderRoot.querySelector("sl-tab-group") as any)?.syncIndicator();
  }

  protected _handleSelectedCard(ev) {
    this._GUImode = true;
    this._guiModeAvailable = true;
    this._selectedCard = parseInt(ev.detail.name, 10);
  }

  protected _handleConfigChanged(ev: HASSDomEvent<ConfigChangedEvent>) {
    ev.stopPropagation();
    if (!this._config) {
      return;
    }

    const cards = [...this._config.cards];
    const newCard = ev.detail.config as LovelaceCardConfig;
    cards[this._selectedCard] = newCard;
    this._config = { ...this._config, cards };
    this._guiModeAvailable = ev.detail.guiModeAvailable;
    fireEvent(this, "config-changed", { config: this._config });
  }

  protected _valueChanged(ev: CustomEvent): void {
    // If some of the config values are the default values, we remove them
    const config = ev.detail.value as StackInCardConfig;
    if (config.disable_padding === CARD_DEFAULT_DISABLE_PADDING) {
      delete config.disable_padding;
    }
    if (config.horizontal === CARD_DEFAULT_HORIZONTAL) {
      delete config.horizontal;
    }

    fireEvent(this, "config-changed", { config: config });
  }

  private _computeLabelCallback = (schema: SchemaUnion<typeof SCHEMA>) => {
    switch (schema.name) {
      case "horizontal":
        return "Horizontal";
      case "disable_padding":
        return "Disable Padding";
      case "title":
        return this._hass!.localize("ui.panel.lovelace.editor.card.generic.title");
    }
  };

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
    this._keys.clear();
    fireEvent(this, "config-changed", { config: this._config });
  }

  protected _handleCopyCard() {
    if (!this._config) {
      return;
    }
    this._clipboard = deepClone(this._config.cards[this._selectedCard]);
  }

  protected _handleCutCard() {
    this._handleCopyCard();
    this._handleDeleteCard();
  }

  protected _handleDeleteCard() {
    if (!this._config) {
      return;
    }
    const cards = [...this._config.cards];
    cards.splice(this._selectedCard, 1);
    this._config = { ...this._config, cards };
    this._selectedCard = Math.max(0, this._selectedCard - 1);
    this._keys.clear();
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
    this._keys.clear();
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

  static get styles(): CSSResultGroup {
    return css`
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
        justify-content: space-between;
        align-items: center;
      }
      sl-tab-group {
        flex-grow: 1;
      }
      #add-card {
        min-width: 0;
        --ha-tab-track-color: var(--card-background-color);
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
    `;
  }
}
