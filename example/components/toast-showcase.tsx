import { View } from "react-native";
import { Button, toast } from "../../src";
import { DemoSection } from "./demo";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ToastShowcase() {
  return (
    <DemoSection title="Toasts">
      <View className="items-center gap-3 py-6">
        <Button
          className="self-center"
          variant="secondary"
          onPress={() => toast.success("Changes published")}
        >
          Success
        </Button>
        <Button
          className="self-center"
          variant="secondary"
          onPress={() =>
            toast.info("New version available", {
              description: "Restart the app to update to 2.4.",
            })
          }
        >
          With description
        </Button>
        <Button
          className="self-center"
          variant="secondary"
          onPress={() =>
            toast("Message archived", {
              action: {
                label: "Undo",
                onPress: () => toast.success("Message restored"),
              },
            })
          }
        >
          With action
        </Button>
        <Button
          className="self-center"
          variant="secondary"
          onPress={() =>
            void toast.promise(wait(1800), {
              loading: "Uploading photo",
              success: "Photo uploaded",
              error: "Upload failed",
            })
          }
        >
          Loading, then done
        </Button>
        <Button
          className="self-center"
          variant="ghost"
          onPress={() =>
            toast.error("Couldn't send message", {
              description: "Check your connection and try again.",
            })
          }
        >
          Error
        </Button>
      </View>
    </DemoSection>
  );
}
