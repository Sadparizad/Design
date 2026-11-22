import { Things } from "./Things.tsx";
import { Workflow } from "./Workflow.tsx";

/** The home page body: the workflow, then the things the Hub links to. */
export function Home() {
  return (
    <>
      <Workflow />
      <Things />
    </>
  );
}
