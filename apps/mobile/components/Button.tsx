import { Factory, Pressable, Text, View } from "native-base";
import { ActivityIndicator } from "react-native";

interface ButtonProps {
  text: string;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  state?: string;
}

export const Button = ({
  text,
  onPress,
  disabled,
  loading,
  state,
}: ButtonProps) => (
  <Pressable
    disabled={disabled || loading}
    onPress={onPress}
    alignSelf="center"
  >
    {/* @ts-ignore -- as per docs but TS types don't match up */}
    {({ isPressed }) => (
      <ButtonContainer
        backgroundColor={
          isPressed || disabled || loading || state === "BUTTON_PRESSED"
            ? "blue.300"
            : "blue.500"
        }
      >
        {!loading ? (
          <Text textAlign="center">{text}</Text>
        ) : (
          <ActivityIndicator />
        )}
      </ButtonContainer>
    )}
  </Pressable>
);

const ButtonContainer = Factory(View, {
  baseStyle: {
    alignSelf: "center",
    borderRadius: 8,
    paddingX: 10,
    paddingY: 5,
    width: 200,
  },
});
