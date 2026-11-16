import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    /* WAVE 413. Stated rather than inherited, because it is a decision: a
       forward navigation goes to the top of the new page INSTANTLY, and back
       restores the position the visitor left, both handled by the router
       rather than hand-rolled in a component. `smooth` here would scroll the
       whole length of a page the visitor has not asked to see, which on
       /legal or a partner page is several thousand pixels of travel between
       pressing a link and being able to read anything. The 200ms rise on
       <main> in __root.tsx is what marks the arrival instead. */
    scrollRestorationBehavior: "auto",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
