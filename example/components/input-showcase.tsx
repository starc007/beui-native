import { useRef, useState } from "react";
import { Pressable, type TextInput, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import { Input } from "../../src";
import { DemoSection } from "./demo";
import { EyeIcon, EyeOffIcon, MailIcon, SearchIcon } from "./icons";

export function InputShowcase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("hunter2");
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("Ada");
  const { color: muted } = useResolveClassNames("text-muted");
  const passwordRef = useRef<TextInput>(null);
  const searchRef = useRef<TextInput>(null);

  const emailError =
    email.length > 0 && !email.includes("@")
      ? "Enter a valid email address."
      : undefined;

  return (
    <>
      <DemoSection
        title="Validation"
        description="Type an address without @ to see the error shake. Return moves to the next field."
      >
        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
          leftIcon={MailIcon}
          value={email}
          onChangeText={setEmail}
          error={emailError}
          reserveErrorLine
        />
      </DemoSection>
      <DemoSection
        title="Icons and controls"
        description="A trailing control, and a check that draws on success."
      >
        <View className="gap-1">
          <Input
            ref={passwordRef}
            label="Password"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => searchRef.current?.focus()}
            secureTextEntry={!visible}
            value={password}
            onChangeText={setPassword}
            rightIcon={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={visible ? "Hide password" : "Show password"}
                hitSlop={8}
                onPress={() => setVisible(!visible)}
              >
                {visible ? (
                  <EyeOffIcon size={16} color={muted} />
                ) : (
                  <EyeIcon size={16} color={muted} />
                )}
              </Pressable>
            }
            reserveErrorLine
          />
          <Input
            ref={searchRef}
            label="Search"
            returnKeyType="search"
            leftIcon={SearchIcon}
            value={query}
            onChangeText={setQuery}
            success={query.length > 1}
          />
        </View>
      </DemoSection>
      <DemoSection title="Disabled">
        <Input label="Account ID" defaultValue="Read only" disabled />
      </DemoSection>
    </>
  );
}
