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
