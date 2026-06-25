/**
 * Spaces out when component previews START bundling. Each Sandpack preview opens
 * a connection to the bundler runtime on mount; when a whole category of heavy
 * WebGL components (three / ogl / fiber) scrolls into view, they all connect at
 * once and the runtime times out ("Couldn't connect to server … ERROR: TIME_OUT").
 *
 * We serialize mount-starts ~GAP ms apart through a shared promise chain — the
 * offscreen lazy-mount still defers work; this just smooths the burst when many
 * cards become visible together. Pure scheduling: no Sandpack coupling, and a
 * card that unmounts before its turn cancels cleanly.
 */

const GAP_MS = 350;

let chain: Promise<void> = Promise.resolve();

/**
 * Request a staggered mount. `start` runs when this card's turn comes up; the
 * returned function cancels the request if the card unmounts first.
 */
export function scheduleMount(start: () => void): () => void {
  let cancelled = false;
  chain = chain.then(
    () =>
      new Promise<void>((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }
        start();
        // Hold the slot briefly so the next mount-start is offset, not piled on.
        setTimeout(resolve, GAP_MS);
      }),
  );
  return () => {
    cancelled = true;
  };
}
