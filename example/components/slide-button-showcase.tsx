import { useEffect, useRef, useState } from "react";
import { SlideButton, type SlideButtonState } from "../../src";
import { DemoSection, DemoStatus } from "./demo";

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Spins for a moment, then succeeds or fails, then resets. */
function useRun(fail = false) {
  const [state, setState] = useState<SlideButtonState>("idle");
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );
  const run = async () => {
    setState("loading");
    await wait(1200);
    if (!live.current) return;
    setState(fail ? "error" : "success");
    await wait(1600);
    if (live.current) setState("idle");
  };
  return { state, run };
}

export function SlideButtonShowcase() {
  const send = useRun();
  const fail = useRun(true);
  const small = useRun();
  const [past, setPast] = useState(false);

  return (
    <>
      <DemoSection title="Slide to confirm">
        <DemoStatus>
          {send.state === "idle"
            ? past
              ? "Let go to send"
              : "Drag the thumb to the end"
            : send.state === "loading"
              ? "Sending"
              : "Sent"}
        </DemoStatus>
        <SlideButton
          label="Slide to send"
          loadingLabel="Sending"
          successLabel="Sent"
          state={send.state}
          onSlideComplete={send.run}
          onThresholdChange={setPast}
        />
      </DemoSection>
      <DemoSection title="When it fails">
        <SlideButton
          label="Slide to pay"
          state={fail.state}
          onSlideComplete={fail.run}
        />
      </DemoSection>
      <DemoSection title="Medium">
        <SlideButton
          size="md"
          label="Slide to unlock"
          state={small.state}
          onSlideComplete={small.run}
        />
      </DemoSection>
      <DemoSection title="Disabled">
        <SlideButton
          label="Enter an amount"
          disabled
          onSlideComplete={() => {}}
        />
      </DemoSection>
    </>
  );
}
