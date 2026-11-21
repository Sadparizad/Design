---
name: spec-from-prd
description: Turn a PRD (a file, a link, pasted text, or a few sentences) into a new feature spec.md file. Use when the designer says "spec from PRD", or shares a PRD.
---

# spec-from-prd

Write the spec for one feature, from a PRD or from a few sentences. The spec is the first thing every person and every agent reads, so it must be clear, short and honest. Never invent facts.

## Inputs

- A PRD: pasted text, a file, or a link. Or the designer's own few sentences.
- A feature name. If there is none, propose a short folder name (lowercase, words joined with hyphens) and ask the designer to confirm.

## Step 1: Read first

Read these files before you write anything:

- `design/features/_template/spec.md`: the template. Its the only structure you should exactly follow for create new spec file.
- `design/product/product.md`: language, direction (LTR or RTL), platforms.
- `design/product/persona.md`: who we design for.

## Step 2: Create the feature folder

- Copy `design/features/_template/` to `design/features/<name>/`.
- If `design/features/<name>/` already exists and its `spec.md` has content, do **not** overwrite it. Write the new version to `spec.new.md` next to it, and Let know the designer. Never overwrite hand edits.

## Step 3: Fill `spec.md`

Keep every heading from the template, in the same order, even if a section ends up empty. Do not rename headings. Do not add IDs anywhere except user stories.

| Section | How to fill it |
|---|---|
| Title | The feature name. |
| Summary | One or two sentences: what it is and who it is for. |
| Problem | Two or three sentences. Who has the problem, and what goes wrong for them. Short. |
| Evidence | Only facts that are in the PRD or the designer's material: numbers, quotes, links. Write where each one comes from. If there is nothing, leave the section empty. |
| Out of scope | What the PRD says we will not do. If the PRD is silent, leave it empty and add an open question. |
| User stories | One row for each user need, in the form: As a <user>, I want <action>, so that <benefit>. IDs are `US-01`, `US-02`, and so on, in order. One need per story. Do not mix two needs in one row. |
| Acceptance checks | At least one check for each story. Use: Given <situation>, when <action>, then <result>. The "For" column holds the story ID. |
| States | Keep the template rows. Write "Yes" in "Needed" for each state the stories need. Always think about Empty, Error and Long text. Mark "RTL layout" as needed if `product.md` says the product supports RTL. Add rows for states that are special to this feature. |
| Strings used | Draft the words for the main screens. One row for each: a key (`feature.area.name`), the text, and where it appears. Also write the same keys to the feature's `strings.json` (or to the central strings file, if `design/AGENT.md` names one). |
| Open questions | Everything the PRD leaves unclear. Each row has an owner and a temporary answer, so the work can go on. Use a role (PM, Engineering, Design) when you do not know a name. |
| Decisions | Only decisions the PRD states clearly, with who and when. If there are none, leave the table with its placeholder row removed. Never invent a decision. |

Rules for the text:

- Headings stay in English.
- Use short, complete sentences. No filler.
- Never invent numbers, names, dates or research. When you do not know, write "TBD" and add an open question.
- If the change is small (a text fix, one new state), write a short spec: one story, its checks, and only the states that change.
- Remove the instruction comments (`<!-- ... -->`) from the template.

## Step 4: Check before you finish

- [ ] All template headings are there, in order, with the same names.
- [ ] User story IDs go `US-01`, `US-02`, ... with no gaps. No other IDs exist in the file.
- [ ] Every story has at least one acceptance check, and every "For" value matches a real story.
- [ ] Every open question has an owner and a temporary answer.
- [ ] No template placeholder like `<Question>` is left, except in sections you left empty on purpose.
- [ ] Every key in "Strings used" is also in `strings.json`.
- [ ] If the feature's `README.md` has a stage field, set it to Spec.

## Step 5: Tell the designer

Reply in the designer's language, in a few lines:

- What you created, and where.
- How many stories and checks, and how many open questions.
- The two or three open questions that need the designer or the PM first.