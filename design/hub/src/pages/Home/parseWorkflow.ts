/**
 * Workflow texts are written as one sentence each. Two marks stand in for the parts that are
 * not plain words: `[3]` is the orange numbered circle for step 3, and `backticks` wrap a file
 * or skill name that shows as an inline code chip. Everything else is kept exactly as written.
 */
export type WorkflowPart =
  | { type: "text"; value: string }
  | { type: "step"; value: string }
  | { type: "code"; value: string };

const MARKS = /(`[^`]+`|\[\d+\])/;

export function parseWorkflow(text: string): WorkflowPart[] {
  const parts: WorkflowPart[] = [];
  for (const piece of text.split(MARKS)) {
    if (piece === "") continue;
    if (piece.startsWith("`")) parts.push({ type: "code", value: piece.slice(1, -1) });
    else if (/^\[\d+\]$/.test(piece)) parts.push({ type: "step", value: piece.slice(1, -1) });
    else parts.push({ type: "text", value: piece });
  }
  return parts;
}
