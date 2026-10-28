import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputInstance,
  type TextStyle,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";
import { CloseIcon, SearchIcon } from "./icons";

// Critically damped: an overshoot would push past the space beside the heading.
const GROW = { duration: 340, dampingRatio: 1 };
// The resting search field, before it grows toward the heading.
const COLLAPSED = 148;
const BRAND_GAP = 12;
const WEB_NO_OUTLINE = Platform.select({
  web: { outlineStyle: "none" } as unknown as TextStyle,
  default: {},
});

/** beUI's mark, a rounded ring on a tile, drawn so it follows the theme. */
function Logo() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="size-8 items-center justify-center rounded-[9px] border border-border bg-surface"
    >
      <View className="size-[21px] rounded-[7px] border-[5px] border-foreground" />
    </View>
  );
}

export function HomeHeader({
  title = "beUI",
  query,
  onQueryChange,
}: {
  /** The heading beside the logo. Defaults to "beUI". */
  title?: string;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const { color: muted } = useResolveClassNames("text-muted");
  const { color: foreground } = useResolveClassNames("text-foreground");
  const input = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);
  const [space, setSpace] = useState({ row: 0, brand: 0 });

  const available = Math.max(0, space.row - space.brand - BRAND_GAP);
  const collapsed = Math.min(COLLAPSED, available || COLLAPSED);
  const target = focused || query.length > 0 ? available : collapsed;

  const width = useSharedValue(COLLAPSED);
  const measured = space.row > 0;
  useEffect(() => {
    if (measured) width.value = reduce ? target : withSpring(target, GROW);
  }, [measured, reduce, target, width]);
  const fieldStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="w-full max-w-160 self-center px-5 pb-3"
    >
      <View
        className="h-11 flex-row items-center justify-between"
        onLayout={({ nativeEvent }) => {
          const row = nativeEvent.layout.width;
          setSpace((current) => ({ ...current, row }));
        }}
      >
        <View
          className="flex-row items-center gap-2.5"
          onLayout={({ nativeEvent }) => {
            const brand = nativeEvent.layout.width;
            setSpace((current) => ({ ...current, brand }));
          }}
        >
          <Logo />
          <Text
            accessibilityRole="header"
            className="text-[22px] font-semibold tracking-tight text-foreground"
          >
            {title}
          </Text>
        </View>

        <Animated.View
          style={fieldStyle}
          className={`h-10 flex-row items-center rounded-full border bg-surface pl-3 ${focused ? "border-border-strong" : "border-border"}`}
        >
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no"
            onPress={() => input.current?.focus()}
            className="h-full justify-center pr-2"
          >
            <SearchIcon size={16} color={muted} />
          </Pressable>
          <TextInput
            ref={input}
            value={query}
            onChangeText={onQueryChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search"
            placeholderTextColor={muted}
            accessibilityLabel="Search components"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              height: "100%",
              color: foreground,
              fontSize: 16,
              paddingVertical: 0,
              includeFontPadding: false,
              textAlignVertical: "center",
              // The pill's border shows focus. Chrome draws an "auto" outline
              // whatever its width, so the style itself has to go.
              ...WEB_NO_OUTLINE,
            }}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={4}
              onPress={() => {
                onQueryChange("");
                input.current?.focus();
              }}
              className="size-10 items-center justify-center"
            >
              <CloseIcon size={16} color={muted} />
            </Pressable>
          ) : (
            <View className="w-3" />
          )}
        </Animated.View>
      </View>
    </View>
  );
}
