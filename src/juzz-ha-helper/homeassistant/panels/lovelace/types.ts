import { HomeAssistant } from "../../types";
import { LovelaceCardConfig } from "../../data/lovelace";

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  isPanel?: boolean;
  editMode?: boolean;
  getCardSize(): number | Promise<number>;
  setConfig(config: LovelaceCardConfig): void;
}
