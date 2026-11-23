---
name: figma-frame-links
description: Takes one Figma link to a handoff page or section and writes a link with a one-line title for every frame into the feature's design/figma.md. Use when the designer says "figma frame links" or shares a handoff link and wants the frames listed.
---

# figma-frame-links

Turn one Figma link into a list of frames. Each frame gets a one-line title and its own link, and the list goes into the feature's `design/figma.md`. Later, an agent can read that file and go through the handoff screen by screen, with a link to every frame. Never invent what a frame shows.

## Inputs

- One Figma link to the handoff: a page, a section, or a single frame. It must be a `/design/` link.
- The feature folder name. If the designer did not give it, ask. Never guess.

## Step 1: Read first

- `design/features/<name>/design/figma.md`: the file you will write to. Keep its header and every line that is not in the "Handoff frames" list.
- `design/features/<name>/spec.md`: use its words (screen names, states) in the titles.

If `design/features/<name>/` does not exist, stop and tell the designer. Do not create the feature folder.

## Step 2: Find the frames

1. Take the file key and the `node-id` from the link. If the link has a branch (`/branch/<branchKey>/`), use the branch key as the file key.
2. Call `create_session` with the file key and a short description of the work. Pass the returned `sessionId` on every later Figma call.
3. Call `get_metadata`. If the link has no `node-id`, call it without `nodeId`, show the designer the page names, and ask which one holds the handoff.
4. Collect frames from the result:
   - A page or a section: take its direct child frames. Go inside sections that hold other sections, so you reach the frames.
   - A single frame: that frame is the only one.
   - Do **not** go inside a frame. Layers inside a frame are parts of that screen.
   - Skip everything that is not a frame: text notes, stickers, arrows, images, components on the canvas, and hidden layers.
5. Put the frames in reading order: rows from top to bottom, and left to right inside a row. Use the positions from `get_metadata`.

## Step 3: Write the titles

One line for each frame, in English, in the form: what the screen is, and the state if it is not the normal one.

- Good: `Payment list`, `Payment list, empty`, `Payment detail, failed payment`, `Filter sheet, open`.
- Bad: `Frame 12`, `Final v3`, `Screen`.
- Use the frame's own name when it is already clear. Otherwise call `get_screenshot` for that frame with `maxDimension` 512, look at it, and write the title from what you see.
- At most eight words. No colon in the title, no link syntax, no emoji.
- Titles must be different from each other. If two frames look alike, say what differs: `Payment list, 1 filter`, `Payment list, 3 filters`.
- If you cannot tell what a frame shows, write `Unclear frame` and list it in your reply. Do not guess.

## Step 4: Write the links

Build each link from the file key and the frame's node ID. Write the node ID with a hyphen, not a colon (`12:34` becomes `12-34`):

`https://www.figma.com/design/<fileKey>/<fileName>?node-id=<12-34>`

Take `<fileName>` from the link the designer gave you.

In `design/features/<name>/design/figma.md`, put one line per frame under the `## Handoff frames` heading. Add the heading at the end of the file if it is not there:

```
- Payment list: [Figma frame](https://www.figma.com/design/<fileKey>/<fileName>?node-id=1-2)
```

Rules for the update:

- Keep the reading order from step 2.
- If a line with the same node ID is already there, keep its title. The designer may have edited it. Only update its link if it changed.
- Add new frames in their place in the order.
- Do **not** delete a line whose frame is no longer in Figma. Leave it and list it in your reply.
- Remove the placeholder line (`- <One-line title>: ...`) once there is a real line.
- Do not touch the other lines in the file.

## Step 5: Check before you finish

- [ ] Every frame in the handoff has exactly one line, and no line appears twice.
- [ ] Every line is in the form `- Title: [Figma frame](https://...)`, with `node-id` using hyphens.
- [ ] No title has a colon, and no two titles are the same.
- [ ] The header and the other lines of the file are unchanged.

## Step 6: Tell the designer

Reply in the designer's language, in a few lines:

- How many frames you listed, and where (`design/features/<name>/design/figma.md`).
- Frames you could not name (`Unclear frame`), and lines whose frame is no longer in Figma.
- Anything you skipped, such as hidden layers or non-frame layers.
