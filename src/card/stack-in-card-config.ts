import { LovelaceCardConfig } from "juzz-ha-helper";
import { any, array, boolean, object, optional, string } from "superstruct";

export interface StackInCardConfig extends LovelaceCardConfig {
  title?: string;
  horizontal?: boolean;
  disable_padding?: boolean;
  cards: LovelaceCardConfig[];
}

// Enforce strict types for internal use
export type StackInCardConfigStrict = StackInCardConfig & {
  horizontal: boolean;
  disable_padding: boolean;
};

export const StackInCardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    title: optional(string()),
    horizontal: optional(boolean()),
    disable_padding: optional(boolean()),
    cards: array(any()),
  }),
);
