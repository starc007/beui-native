import { useState } from "react";
import { Text, View } from "react-native";
import {
  applyKeypadKey,
  Keypad,
  KeypadDelete,
  KeypadKey,
  KeypadRow,
} from "../../src";
import { DemoSection } from "./demo";

const PIN = 4;

function AmountDemo() {
  const [amount, setAmount] = useState("");
  return (
    <View className="gap-3">
      <Text
        accessibilityLiveRegion="polite"
        className={`text-center text-4xl font-semibold ${amount ? "text-foreground" : "text-muted"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        ${amount || "0"}
      </Text>
      <Keypad
        onKeyPress={(key) => setAmount((a) => applyKeypadKey(a, key))}
        onDeleteLongPress={() => setAmount("")}
      />
    </View>
  );
}

function PasscodeDemo() {
  const [code, setCode] = useState("");
  return (
    <View className="gap-5">
      <View
        className="flex-row justify-center gap-4"
        accessible
        accessibilityLabel={`${code.length} of ${PIN} digits entered`}
      >
        {Array.from({ length: PIN }, (_, i) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed slots
            key={i}
            className={`size-3.5 rounded-full border-2 border-foreground ${i < code.length ? "bg-foreground" : ""}`}
          />
        ))}
      </View>
      <Keypad
        variant="circle"
        layout="pin"
        showDelete={code.length > 0}
        onKeyPress={(key) =>
          setCode((c) =>
            key === "delete" ? c.slice(0, -1) : c.length < PIN ? c + key : c,
          )
        }
      />
    </View>
  );
}

/** Built key by key: a "00" key and a text key for clearing. */
function ComposedDemo() {
  const [amount, setAmount] = useState("");
  const press = (key: string) =>
    setAmount((a) =>
      key === "00"
        ? applyKeypadKey(applyKeypadKey(a, "0", { decimals: 0 }), "0", {
            decimals: 0,
          })
        : applyKeypadKey(a, key, { decimals: 0 }),
    );
  return (
    <View className="gap-3">
      <Text
        className={`text-center text-3xl font-semibold ${amount ? "text-foreground" : "text-muted"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amount || "0"} pts
      </Text>
      <Keypad size="sm" onKeyPress={press}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
        ].map((row) => (
          <KeypadRow key={row[0]}>
            {row.map((d) => (
              <KeypadKey key={d} value={d} />
            ))}
          </KeypadRow>
        ))}
        <KeypadRow>
          <KeypadKey value="00" accessibilityLabel="Double zero" />
          <KeypadKey value="0" />
          <KeypadDelete onLongPress={() => setAmount("")} />
        </KeypadRow>
        <KeypadRow>
          <KeypadKey value="clear" onPress={() => setAmount("")}>
            <Text className="text-sm font-medium text-muted">Clear</Text>
          </KeypadKey>
        </KeypadRow>
      </Keypad>
    </View>
  );
}

export function KeypadShowcase() {
  return (
    <>
      <DemoSection title="Amount">
        <AmountDemo />
      </DemoSection>
      <DemoSection title="Passcode">
        <PasscodeDemo />
      </DemoSection>
      <DemoSection title="Composed">
        <ComposedDemo />
      </DemoSection>
    </>
  );
}
