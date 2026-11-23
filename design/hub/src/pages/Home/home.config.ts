/**
 * The home page's own words and wiring, all in one place.
 *
 * Nothing else on the home page is written by hand: the Files cards take their title and
 * description from the route table, the Skills cards come from the skills folders, and each
 * Source card reads its link and blurb from its own file.
 */

export interface WorkflowOption {
  /** What the dropdown stores. */
  value: string;
  /** The wording in the dropdown. */
  label: string;
  /**
   * The workflow as one sentence, written exactly as in the design.
   * `[3]` marks the orange step number, and `backticks` wrap a name that shows as a code chip.
   */
  text: string;
}

export const WORKFLOWS: readonly WorkflowOption[] = [
  {
    value: "key-screens",
    label: "If you have key screen designs",
    text:
      "[1] Start with a `PRD` file. " +
      "[2] Run `spec-from-prd` skill, " +
      "[3] Answer the open questions and approve the `spec.md` file. " +
      "[4] Share your key screens and any references with agent. " +
      "[5] Ask agent to complete your designs in Figma, then review them. " +
      "[6] Ask agent to implement them in the `prototype-shell.` " +
      "[7] Open the shell and compare the designs on mobile and desktop. " +
      "[8] Record your choice in the decisions section of `spec.md` and review the `handoff` files before sending them to dev team.",
  },
  {
    value: "ai-everything",
    label: "If you want AI design everything",
    text:
      "[1] Start with a `PRD` file. " +
      "[2] Run the `spec-from-prd` skill, " +
      "[3] Answer the open questions and approve the `spec.md` file. " +
      "[4] Share any references with agent. " +
      "[5] Ask agent to design the variants. " +
      "[6] Open the shell, switch between the variants, and give feedback until you're happy with one. " +
      "[7] Record your choice in the decision section of `spec.md` and review the handoff files before sending them to engineering.",
  },
];

/**
 * Chips that open a page of the Hub, by the chip's text. A chip with no entry stays plain text:
 * the Hub has no page for the prototype shell or the handoff files yet.
 * A spec.md lives inside each feature, so it opens the design history, where the features are.
 */
export const WORKFLOW_LINKS: Readonly<Record<string, string>> = {
  PRD: "#/files/product-prd",
  "spec-from-prd": "#/skills/spec-from-prd",
  "spec.md": "#/history",
};

/**
 * The file that holds the Storybook link, and optionally `updated: YYYY-MM-DD` in its front matter.
 * The Storybook card opens the Hub's own Storybook page, which reads this file.
 */
export const STORYBOOK_PATH = "product/design-system/storybook/README.md";

/**
 * The file that holds the Figma links, one list line each: `- Name: [Figma file](link)`.
 * The Figma card opens the Hub's own Figma page, which reads this file.
 */
export const FIGMA_PATH = "product/design-system/figma.md";

/** The two Files cards. Each one's title and description come from that route's page copy. */
export const FILE_ROUTES: readonly string[] = ["#/history", "#/files"];

/** The two Sources cards. Each one's title and description come from that route's page copy. */
export const SOURCE_ROUTES: readonly string[] = ["#/storybook", "#/figma"];
