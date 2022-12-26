import { LovelaceCardConfig } from "./juzz-ha-helper";

export interface StackInCardConfig extends LovelaceCardConfig {
  title?: string;
  horizontal: boolean;
  disable_padding: boolean;
  cards: LovelaceCardConfig[];
}
