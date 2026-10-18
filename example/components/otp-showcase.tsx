import { useEffect, useState } from "react";
import { OTPInput, type OTPStatus } from "../../src";
import { DemoSection } from "./demo";

const CODE = "123456";

export function OTPShowcase() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OTPStatus>("idle");
  const [pin, setPin] = useState("");

  // After the shake, clear the slots for another try. The error message stays
  // until the next digit.
  useEffect(() => {
    if (status !== "error") return;
    const timer = setTimeout(() => setCode(""), 900);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <>
      <DemoSection title="Verification">
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
      <DemoSection title="Masked PIN">
        <OTPInput
          label="PIN"
          length={4}
          mask
          blurOnComplete
          value={pin}
          onChangeText={setPin}
        />
      </DemoSection>
    </>
  );
}
