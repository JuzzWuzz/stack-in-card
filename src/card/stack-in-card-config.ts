import { LovelaceCardConfig, baseLovelaceCardConfig } from "juzz-ha-helper";
import { any, array, assign, boolean, object, optional, string } from "superstruct";

export interface StackInCardConfig extends LovelaceCardConfig {
  title?: string;
  horizontal?: boolean;
  disable_padding?: boolean;
  center_horizontal_cards?: boolean;
  cards: LovelaceCardConfig[];
}

// Enforce strict types for internal use
export type StackInCardConfigStrict = StackInCardConfig & {
  horizontal: boolean;
  disable_padding: boolean;
  center_horizontal_cards: boolean;
};

export const StackInCardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    title: optional(string()),
    horizontal: optional(boolean()),
    disable_padding: optional(boolean()),
    center_horizontal_cards: optional(boolean()),
    cards: array(any()),
  }),
);

export const SCHEMA = [
  {
    name: "title",
    selector: { text: {} },
  },
  {
    name: "horizontal",
    required: false,
    selector: { boolean: {} },
  },
  {
    name: "disable_padding",
    required: false,
    selector: { boolean: {} },
  },
  {
    name: "center_horizontal_cards",
    required: false,
    selector: { boolean: {} },
  },
] as const;
