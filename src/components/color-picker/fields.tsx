import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useResolveClassNames } from "uniwind";
import { useShake } from "../../hooks/use-shake";
import { EASE_OUT } from "../../styles/motion";
import {
  clamp,
  type Hsva,
  hslToHsv,
  hsvToHsl,
  parseHex,
  type Rgba,
  rgbaToHsva,
} from "./color";
import { usePickerContext } from "./context";

const SHAKE = [0, -5, 5, -3, 3, 0];

// Web draws a focus outline; the field's border shows focus instead. React
// Native's types don't list "none", but React Native Web passes it through.
const WEB_NO_OUTLINE =
  Platform.OS === "web" ? { outlineStyle: "none" as "solid" } : null;

function useFieldColors() {
  const { color: foreground } = useResolveClassNames("text-foreground");
  const { color: muted } = useResolveClassNames("text-muted");
  return { foreground, muted };
}

export type ColorPickerHexInputProps = Omit<
  TextInputProps,
  "value" | "defaultValue" | "onChangeText"
> & { className?: string };

/**
 * The hex field. It updates the color live once six or eight digits are in,
 * and shakes and reverts if what's left on submit isn't a color.
 */
export function ColorPickerHexInput({
  className = "",
  accessibilityLabel = "Hex color",
  onBlur,
  onSubmitEditing,
  style,
  ...props
}: ColorPickerHexInputProps) {
  const { hsva, hex, update, commit, disabled, reduce } = usePickerContext(
    "ColorPickerHexInput",
  );
  const { foreground, muted } = useFieldColors();
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const { shake, style: shakeStyle } = useShake(SHAKE, 300, EASE_OUT);

  const settle = () => {
    if (draft === null) return;
    const parsed = parseHex(draft);
    if (parsed) {
      update(rgbaToHsva(parsed, hsva));
      commit();
    } else if (!reduce) {
      shake();
    }
    setDraft(null);
  };

  return (
    <Animated.View
      style={shakeStyle}
      className={`min-w-0 flex-1 flex-row items-center rounded-lg border bg-background pl-3 ${focused ? "border-border-strong" : "border-border"} ${className}`}
    >
      <Text className="text-sm text-muted">#</Text>
      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel}
        editable={!disabled}
        autoCapitalize="characters"
        autoCorrect={false}
        spellCheck={false}
        maxLength={9}
        returnKeyType="done"
        value={draft ?? hex.slice(1).toUpperCase()}
        placeholderTextColor={muted}
        onFocus={() => setFocused(true)}
        onChangeText={(text) => {
          const next = text.replace(/^#/, "");
          setDraft(next);
          // Live only at full length, so "ABC" on the way to "ABCDEF" doesn't
          // flash a short-form color.
          if (next.length === 6 || next.length === 8) {
            const parsed = parseHex(next);
            if (parsed) update(rgbaToHsva(parsed, hsva));
          }
        }}
        onBlur={(event) => {
          setFocused(false);
          settle();
          onBlur?.(event);
        }}
        onSubmitEditing={(event) => {
          settle();
          onSubmitEditing?.(event);
        }}
        style={[styles.field, { color: foreground }, WEB_NO_OUTLINE, style]}
      />
    </Animated.View>
  );
}

type ChannelSpec = {
  key: string;
  short: string;
  name: string;
  max: number;
  value: number;
  set: (n: number) => Hsva;
};

function ChannelField({ spec }: { spec: ChannelSpec }) {
  const { update, commit, disabled } = usePickerContext("ColorPickerChannels");
  const { foreground } = useFieldColors();
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const shown = Math.round(spec.value);

  return (
    <View className="min-w-0 flex-1 items-center gap-1">
      <View
        className={`h-9 w-full justify-center rounded-lg border bg-background ${focused ? "border-border-strong" : "border-border"}`}
      >
        <TextInput
          accessibilityLabel={spec.name}
          editable={!disabled}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
          value={draft ?? String(shown)}
          onFocus={() => setFocused(true)}
          onChangeText={(text) => {
            const next = text.replace(/[^\d]/g, "").slice(0, 3);
            setDraft(next);
            if (next !== "") update(spec.set(clamp(Number(next), 0, spec.max)));
          }}
          onBlur={() => {
            setFocused(false);
            if (draft !== null) commit();
            setDraft(null);
          }}
          style={[
            styles.field,
            styles.center,
            { color: foreground },
            WEB_NO_OUTLINE,
          ]}
        />
      </View>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no"
        className="text-[11px] font-medium text-muted"
      >
        {spec.short}
      </Text>
    </View>
  );
}

export type ColorPickerChannelsProps = {
  /** Which channels to edit. Defaults to "rgb". */
  format?: "rgb" | "hsl";
  className?: string;
};

/** Numeric RGB or HSL fields, plus opacity when the picker allows alpha. */
export function ColorPickerChannels({
  format = "rgb",
  className = "",
}: ColorPickerChannelsProps) {
  const { hsva, rgba, alpha } = usePickerContext("ColorPickerChannels");
  const fromRgb = (patch: Partial<Rgba>) =>
    rgbaToHsva({ ...rgba, ...patch }, hsva);
  let specs: ChannelSpec[];
  if (format === "hsl") {
    const hsl = hsvToHsl(hsva);
    specs = [
      {
        key: "h",
        short: "H",
        name: "Hue",
        max: 360,
        value: hsl.h,
        set: (n) => hslToHsv(n, hsl.s, hsl.l, hsva, hsva.a),
      },
      {
        key: "s",
        short: "S",
        name: "Saturation",
        max: 100,
        value: hsl.s,
        set: (n) => hslToHsv(hsl.h, n, hsl.l, hsva, hsva.a),
      },
      {
        key: "l",
        short: "L",
        name: "Lightness",
        max: 100,
        value: hsl.l,
        set: (n) => hslToHsv(hsl.h, hsl.s, n, hsva, hsva.a),
      },
    ];
  } else {
    specs = [
      {
        key: "r",
        short: "R",
        name: "Red",
        max: 255,
        value: rgba.r,
        set: (n) => fromRgb({ r: n }),
      },
      {
        key: "g",
        short: "G",
        name: "Green",
        max: 255,
        value: rgba.g,
        set: (n) => fromRgb({ g: n }),
      },
      {
        key: "b",
        short: "B",
        name: "Blue",
        max: 255,
        value: rgba.b,
        set: (n) => fromRgb({ b: n }),
      },
    ];
  }
  if (alpha) {
    specs.push({
      key: "a",
      short: "A",
      name: "Opacity percent",
      max: 100,
      value: hsva.a * 100,
      set: (n) => ({ ...hsva, a: n / 100 }),
    });
  }
  return (
    <View className={`min-w-0 flex-1 flex-row gap-1.5 ${className}`}>
      {specs.map((spec) => (
        <ChannelField key={`${format}-${spec.key}`} spec={spec} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    height: 34,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 6,
    textAlignVertical: "center",
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
  },
  center: { textAlign: "center" },
});
