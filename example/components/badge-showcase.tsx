import { useEffect, useState } from "react";
import { View } from "react-native";
import { AnimatedBadge, type AnimatedBadgeStatus, Button } from "../../src";
import { DemoSection } from "./demo";
import { MailIcon, ShieldIcon } from "./icons";

const STATES: Array<{ status: AnimatedBadgeStatus; label: string }> = [
  { status: "loading", label: "Syncing" },
  { status: "success", label: "Synced" },
  { status: "warning", label: "Review" },
  { status: "danger", label: "Failed" },
];

export function BadgeShowcase() {
  const [active, setActive] = useState(0);
  const [unread, setUnread] = useState(3);
  const state = STATES[active];

  useEffect(() => {
    const id = setInterval(() => {
      setActive((current) => (current + 1) % STATES.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <DemoSection title="Status changes">
        <View className="h-16 items-center justify-center">
          <AnimatedBadge
            status={state?.status}
            accessibilityLiveRegion="polite"
            className="self-center"
          >
            {state?.label}
          </AnimatedBadge>
        </View>
      </DemoSection>

      <DemoSection title="Statuses">
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            <AnimatedBadge status="neutral" size="sm">
              Queued
            </AnimatedBadge>
            <AnimatedBadge status="info" size="sm">
              Live
            </AnimatedBadge>
            <AnimatedBadge status="loading" size="sm">
              Indexing
            </AnimatedBadge>
            <AnimatedBadge status="success" size="sm">
              Verified
            </AnimatedBadge>
            <AnimatedBadge status="warning" size="sm">
              Pending
            </AnimatedBadge>
            <AnimatedBadge status="danger" size="sm">
              Blocked
            </AnimatedBadge>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <AnimatedBadge status="neutral">Queued</AnimatedBadge>
            <AnimatedBadge status="info">Live</AnimatedBadge>
            <AnimatedBadge status="loading">Indexing</AnimatedBadge>
            <AnimatedBadge status="success">Verified</AnimatedBadge>
            <AnimatedBadge status="warning">Pending</AnimatedBadge>
            <AnimatedBadge status="danger">Blocked</AnimatedBadge>
          </View>
        </View>
      </DemoSection>

      <DemoSection title="Counts">
        <View className="flex-row items-center justify-between gap-3">
          <AnimatedBadge
            status={unread > 0 ? "info" : "neutral"}
            icon={MailIcon}
            contentKey={unread}
          >
            {unread > 0 ? `${unread} unread` : "All read"}
          </AnimatedBadge>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              accessibilityLabel="Read one"
              disabled={unread === 0}
              onPress={() => setUnread((n) => Math.max(0, n - 1))}
            >
              Read
            </Button>
            <Button size="sm" onPress={() => setUnread((n) => n + 1)}>
              New mail
            </Button>
          </View>
        </View>
      </DemoSection>

      <DemoSection title="Icons">
        <View className="flex-row flex-wrap gap-2">
          <AnimatedBadge status="success" icon={ShieldIcon}>
            Protected
          </AnimatedBadge>
          <AnimatedBadge status="info" showIcon={false}>
            Beta
          </AnimatedBadge>
          <AnimatedBadge status="warning" accessibilityLabel="Warning" />
        </View>
      </DemoSection>
    </>
  );
}
