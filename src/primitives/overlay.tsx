import { type ReactNode, useEffect, useRef } from "react";
import { Modal, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FullWindowOverlay } from "react-native-screens";

export type OverlayProps = {
  /** Defaults to true. */
  visible?: boolean;
  /** The Android back button. iOS has no equivalent. */
  onRequestClose: () => void;
  /** Called once the overlay is on screen. */
  onShow?: () => void;
  /** Read by VoiceOver as a modal container, so it stays inside. */
  accessibilityViewIsModal?: boolean;
  children: ReactNode;
};

/**
 * A layer above the whole window, for menus, popovers and modals.
 *
 * On iOS a React Native `Modal` is presented from the screen that renders it,
 * so inside native tabs it stops at the tab bar. `FullWindowOverlay` draws in
 * its own window above everything instead. On Android a `Modal` already opens
 * its own window, and handles the back button.
 */
export function Overlay({
  visible = true,
  onRequestClose,
  onShow,
  accessibilityViewIsModal = true,
  children,
}: OverlayProps) {
  // Gestures inside a separate window or a modal need their own root.
  const content = (
    <GestureHandlerRootView style={styles.root}>
      {children}
    </GestureHandlerRootView>
  );

  if (Platform.OS === "ios") {
    return visible ? (
      <IosOverlay onShow={onShow} modal={accessibilityViewIsModal}>
        {content}
      </IosOverlay>
    ) : null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onShow={onShow}
      onRequestClose={onRequestClose}
    >
      {content}
    </Modal>
  );
}

function IosOverlay({
  onShow,
  modal,
  children,
}: {
  onShow?: () => void;
  modal: boolean;
  children: ReactNode;
}) {
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;
  // The overlay is on screen once it mounts.
  useEffect(() => {
    onShowRef.current?.();
  }, []);

  return (
    <FullWindowOverlay unstable_accessibilityContainerViewIsModal={modal}>
      {children}
    </FullWindowOverlay>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
