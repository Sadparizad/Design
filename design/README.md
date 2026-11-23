```bash
cd design/hub && npm start
```

# Design

This folder holds the design work for the product: feature specs, the rules the AI agent follows, the design system links and the skills.

The command above starts the **Design Hub**, a small app that shows these files in your browser. It only runs on your computer, and it reads and saves the files in this folder directly. The first run sets itself up and takes about a minute. It needs [Node.js](https://nodejs.org) 22.12 or newer.

## Staying in sync with GitHub

The Hub does not talk to GitHub. It changes the files on your computer, and Git carries them to and from GitHub.

- Before you start working, pull the latest changes.
- After you save in the Hub, push your changes.

## What lives where

| Folder | What is in it |
|---|---|
| `product/` | Product facts, personas, design language, design system links |
| `features/` | One folder per feature: spec, strings, variants, handoff |
| `skills/` | Instructions the agent follows for a repeatable job |
| `shell/` | The prototype shell |
| `hub/` | The Design Hub app itself |

## How a feature moves

1. **PRD to spec.** Run the `spec-from-prd` skill. It writes the feature's `spec.md`.
2. **Variants and Figma.** Add the design options in `variants.json` and `variants/`, and the Figma links in `design/figma.md`. Run the `figma-frame-links` skill on the handoff link to list every frame with a title.
3. **Prototype.** Build the prototype and keep the strings in `strings.json`.
4. **Check.** Run the `design-qa` skill. It compares the prototype with Figma, `product/design.md` and the spec, and reports what does not match.
5. **Handoff.** Write what changed in `handoff/changelog.md`, then set `status` to `Shipped` and fill in `shipped` in the feature's `README.md`.

## Starting a new feature

1. Copy `features/_template` to `features/<feature-name>`. Use lowercase words joined with hyphens.
2. Fill in the fields at the top of the new `README.md`: `status`, `owner`, `preview`, `started` and `shipped`. The Hub reads only these five fields.
3. Leave `shipped` empty until the feature ships. The list shows it as "Open".

## Skills

| Skill | Use it when |
|---|---|
| `spec-from-prd` | You have a PRD, a link or a few sentences and need a new `spec.md` |
| `figma-frame-links` | You have a handoff link in Figma and want every frame listed, with a title, in `design/figma.md` |
| `design-qa` | A prototype is ready and must be checked against Figma, `design.md` and the spec |
| `sync-design-system` | You want to compare the tokens in `design.md` with Storybook |
| `update-design-md` | `design.md` must be updated after the design language changed |

## Working with the AI agent

The agent starts from `AGENT.md`. Before it designs or writes anything, it reads:

- `product/`: the PRD, personas, journey map, `design.md` and the design system links.
- The feature's `spec.md`, `strings.json` and variants.

When the agent has a skill for the job, it follows the skill's steps. Tell it the skill name, for example "run design-qa on wallet-top-up".

## Published Hub

Every push to `main` that changes `design/` publishes a read-only copy of the Hub to GitHub Pages: <https://sadparizad.github.io/Design/>. It shows the files but cannot edit them. To edit, run the Hub on your computer.
