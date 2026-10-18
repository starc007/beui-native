import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import {
  Button,
  StreamingResponse,
  type StreamingResponseFeedback,
} from "../../src";
import { DemoSection, DemoStatus } from "./demo";
import { useStream } from "./use-stream";

const REPLY = `Springs feel natural because they carry velocity: interrupt one halfway and it bends toward the new target instead of restarting.

For a press, use a stiff spring with little bounce so the surface answers the finger right away. For layout, soften it so panels glide instead of snapping.

Keep exits shorter than entrances. People wait for things to arrive, not to leave.`;

export function StreamingResponseShowcase() {
  const stream = useStream(REPLY, 110);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState<StreamingResponseFeedback>(null);
  const [note, setNote] = useState("Streaming…");

  useEffect(() => {
    if (!stream.done) {
      setComplete(false);
      return;
    }
    const timer = setTimeout(() => {
      setComplete(true);
      setNote("Done. Copy, retry or rate the reply.");
    }, 450);
    return () => clearTimeout(timer);
  }, [stream.done]);

  const replay = () => {
    setFeedback(null);
    setNote("Streaming…");
    stream.start();
  };

  return (
    <DemoSection
      title="Reply"
      description="Text streams in, then the actions rise in beneath it."
    >
      <DemoStatus>{note}</DemoStatus>
      <StreamingResponse
        status={complete ? "complete" : "streaming"}
        onCopy={async () => {
          setNote("Copied to the clipboard.");
          await Clipboard.setStringAsync(REPLY);
        }}
        onRetry={replay}
        feedback={feedback}
        onFeedbackChange={(next) => {
          setFeedback(next);
          setNote(
            next === "up"
              ? "Marked helpful."
              : next === "down"
                ? "Marked not helpful."
                : "Rating cleared.",
          );
        }}
      >
        {stream.text.split("\n\n")}
      </StreamingResponse>
      <Button
        className="self-center"
        size="sm"
        variant="ghost"
        onPress={replay}
      >
        Replay
      </Button>
    </DemoSection>
  );
}
