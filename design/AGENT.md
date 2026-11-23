# Agent guide

You work with a designer or a product manager. Reply in their language. Keep replies short and simple. Never invent facts, numbers, names or decisions. If you do not know, write "TBD" and ask.

## Rules for every job

1. Find the feature. Its folder is `features/<name>/`. If the designer does not say which feature, list the folders in `features/` (not `_template`) and ask.
2. Read only the files the job lists below. If a file is empty or has only `<placeholders>`, say so, do not guess its content, and carry on with "TBD".
3. Do the job yourself. Ask first only where the job says **Ask first**.
4. Never overwrite a file the designer wrote by hand. Write the new version next to it (`spec.new.md`) and tell the designer.
5. Do not commit or push unless the designer asks.
6. End every reply in this form:
   - **Done:** what you did, in one or two lines.
   - **Saved:** the files you created or changed.
   - **Next:** what the designer should do now, or what you can do next. Always give one clear next step.

## Where things live

| What | Where |
|---|---|
| Product facts (languages, platforms, owners) | `product/product-prd.md` |
| Users | `product/persona.md`, `product/user-journey-map.md` |
| Design language and tokens | `product/design.md` |
| Design system links | `product/design-system/figma.md` |
| Feature spec | `features/<name>/spec.md` |
| Feature texts | `features/<name>/strings.json` |
| Feature variants | `features/<name>/variants.json`, `features/<name>/variants/` |
| Feature Figma links | `features/<name>/design/figma.md` |
| Feature prototype | `features/<name>/design/prototype/` |
| Feature references (images, notes) | `features/<name>/design/refs/` |
| Feature status, owner, dates | `features/<name>/README.md` (top fields) |
| Feature history | `features/<name>/handoff/changelog.md` |

## What to do when the designer says...

### "Here is a PRD" or "I want a new feature..."

1. Read `product/product-prd.md`, `product/persona.md`, `features/_template/spec.md`. If the PRD is a link, open it.
2. Run the skill `spec-from-prd`.
3. Save: `features/<name>/spec.md` and `features/<name>/strings.json`.
4. Update: the feature `README.md`. Set `status: Spec`, set `started` to today, and set `owner` if you know the name.
5. **Ask first:** if `features/<name>/` already has a spec with content, write `spec.new.md` instead.
6. Reply with the number of stories, checks and open questions, and the top two or three open questions.
7. Next: answer the open questions, then share the Figma handoff link.

### "Here is the Figma handoff link"

1. Read `features/<name>/design/figma.md` and `features/<name>/spec.md`.
2. Run the skill `links-from-figma`. It needs a `/design/` link. If it is a FigJam or other link, ask for the right one.
3. Save: `features/<name>/design/figma.md`.
4. Reply with the number of frames, and any frame you could not name.
5. Next: say "build the prototype", or add variants first.

### "Here is the design system or user flow link"

1. Add one line to `product/design-system/figma.md`: `- Title: [Figma file](link)`.
2. Next: say "sync the design system" if you want it compared with `design.md`.

### "Add or change a variant"

1. Read `spec.md`, `variants.json` and `variants/`.
2. Save: `variants.json` (`"A": "Label"`) and `variants/<id>.md` (a few lines on what is different).
3. **Ask first:** before you delete or rename a variant.
4. Next: build the prototype for the variants, or pick one.

### "Build the prototype"

1. Read in this order: `product/product-prd.md`, `product/design.md`, `spec.md`, `strings.json`, `variants.json` and `variants/`, `design/figma.md`.
2. Open every frame link in `design/figma.md`, one by one, in order, and build screen by screen. If there are no frame links, ask for the handoff link and run `links-from-figma` first.
3. Use texts only from `strings.json`. If you need a new text, add it to `strings.json` and to "Strings used" in `spec.md`.
4. Use the tokens from `design.md`. If `design.md` is empty, use the values from Figma and say so. Do not invent tokens.
5. Save: `features/<name>/design/prototype/`.
6. Update: the feature `README.md`. Set `status: In progress`.
7. **Ask first:** if the prototype folder already has files, before you replace them.
8. Reply with the screens you built and the frames you did not cover.
9. Next: say "run design QA".

### "Check the prototype" or "run QA"

1. Read `spec.md`, `product/design.md`, `design/figma.md` (and open its frames), and the prototype.
2. Run the skill `design-qa`.
3. Reply in chat only, grouped by Figma, `design.md` and spec. Do not change the prototype.
4. Update: if nothing is wrong, set `status: In review` in the feature `README.md`.
5. Next: say "fix them", or send it for review.

### "Change a text"

1. Read `strings.json` and `spec.md`.
2. Update: `strings.json` and "Strings used" in `spec.md`. Keys look like `feature.area.name`.
3. If a prototype exists, update the text there too.
4. Next: run QA again if the prototype changed.

### "Add or change a user story, state or check"

1. Read `spec.md`.
2. Update: `spec.md`. Keep every heading. Story IDs (`US-01`, ...) are permanent: never renumber or reuse.
3. **Ask first:** before you remove a story.
4. Reply with what else this change touches: strings, variants, prototype.
5. Next: update those, or run QA.

### "It shipped" or "hand off"

1. Read `handoff/changelog.md` and the feature `README.md`.
2. Save: add an entry to `handoff/changelog.md`: `## YYYY-MM-DD` and one line for each change.
3. **Ask first:** before you set `status: Shipped` and fill `shipped` in the feature `README.md`.
4. Next: push the changes to GitHub.

### "Sync" or "update" `design.md` or the design system

1. Read `product/design.md` and `product/design-system/figma.md`.
2. Run `sync-design-system` or `update-design-md`.
3. Reply with the list of differences. Do not edit `design.md`.
4. **Ask first:** which side is right, before any edit.
5. Next: confirm the changes, then I update `design.md`.

### "Change the product facts, persona or journey"

1. Read the file you will change.
2. **Ask first:** always, before editing `product/product-prd.md`, `persona.md` or `user-journey-map.md`. Use the designer's words only. Write "TBD" for what is unknown.
3. Next: tell the designer which features this may affect.

### "What is the status?"

1. Read the top fields of each `features/*/README.md` (not `_template`).
2. Reply with a short table: feature, status, owner.
3. Next: for each feature, one next step.

### Anything else

Ask one short question to find out which job it is. Do not guess.

## Ask first, always

- Replacing a file that has hand-written content.
- Deleting or renaming a variant, a story or a file.
- Editing `product/` files (adding a Figma link line to `product/design-system/figma.md` is fine without asking).
- Setting `status: Shipped`.
- Commit, push or pull request.
