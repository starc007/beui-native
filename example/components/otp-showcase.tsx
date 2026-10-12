import { useState } from "react";
import { OTPInput, type OTPStatus } from "../../src";
import { DemoSection } from "./demo";

const CODE = "123456";

export function OTPShowcase() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OTPStatus>("idle");
  const [pin, setPin] = useState("");

  return (
    <>
      <DemoSection
        title="Verification"
        description="A wrong code shakes; the right one draws a check."
      >
        <OTPInput
          label="Verification code"
          hint={`Enter ${CODE} to verify.`}
          successMessage="Verified."
          errorMessage="Wrong code, try again."
          value={code}
          status={status}
          onChangeText={(next) => {
            setCode(next);
            if (status !== "idle") setStatus("idle");
          }}
          onComplete={(next) => setStatus(next === CODE ? "success" : "error")}
        />
      </DemoSection>
      <DemoSection title="Masked PIN" description="Four slots showing dots.">
        <OTPInput
          label="PIN"
          length={4}
          mask
          value={pin}
          onChangeText={setPin}
        />
      </DemoSection>
    </>
  );
}
