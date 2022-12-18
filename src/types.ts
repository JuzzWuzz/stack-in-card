import { LovelaceCardConfig } from "./juzz-ha-helper";

export interface StackInCardConfig extends LovelaceCardConfig {
  entity?: string;
  title?: string;
  horizontal: boolean;
  setStyles: boolean;
  cards: LovelaceCardConfig[];
}
