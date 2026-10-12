import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useResolveClassNames } from "uniwind";
import { Input, OTPInput, type OTPStatus, Surface } from "../../src";
import { EyeIcon, EyeOffIcon, MailIcon, SearchIcon } from "./icons";

const CODE = "123456";

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="gap-1">
      <Text
        accessibilityRole="header"
        className="text-lg font-semibold text-foreground"
      >
        {title}
      </Text>
      <Text className="text-sm leading-5 text-muted">{description}</Text>
    </View>
  );
}

export function InputShowcase() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("hunter2");
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("Ada");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OTPStatus>("idle");
  const { color: muted } = useResolveClassNames("text-muted");

  const emailError =
    email.length > 0 && !email.includes("@")
      ? "Enter a valid email address."
      : undefined;

  return (
    <>
      <Surface className="gap-5">
        <Header
          title="Input"
          description="Errors shake the field in. A valid value draws a check."
        />
        <View className="gap-1">
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={MailIcon}
            value={email}
            onChangeText={setEmail}
            error={emailError}
            reserveErrorLine
          />
          <Input
            label="Password"
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
            label="Search"
            leftIcon={SearchIcon}
            value={query}
            onChangeText={setQuery}
            success={query.length > 1}
            reserveErrorLine
          />
          <Input label="Disabled" defaultValue="Read only" disabled />
        </View>
      </Surface>

      <Surface className="gap-5">
        <Header
          title="OTP input"
          description="Digits roll into place. A wrong code shakes; the right one draws a check."
        />
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
      </Surface>
    </>
  );
}
