type ScrollRuntime = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

let runtimePromise: Promise<ScrollRuntime> | null = null;

function loadScrollRuntime() {
  if (!runtimePromise) {
    runtimePromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([gsapModule, scrollTriggerModule]) => {
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
        return { gsap, ScrollTrigger };
      },
    );
  }

  return runtimePromise;
}

export function startScrollAnimation(
  setup: (runtime: ScrollRuntime) => (() => void) | void,
) {
  let active = true;
  let teardown = () => {};

  void loadScrollRuntime()
    .then((runtime) => {
      if (!active) return;
      teardown = setup(runtime) ?? (() => {});
      if (active) runtime.ScrollTrigger.refresh();
      else teardown();
    })
    .catch((error: unknown) => {
      if (active) console.error("Unable to initialize scroll animation", error);
    });

  return () => {
    active = false;
    teardown();
  };
}