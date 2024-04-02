import { Button } from "@/components/Button";

export default {
  title: "Button",
  component: Button,
  argTypes: {
    onPress: { action: "pressed the button" },
  },
};

export const Default = {
  args: {
    state: "BUTTON",
    text: "Placeholder",
    disabled: false,
    loading: false,
    state: "BUTTON",
  },
};

export const Disabled = {
  args: {
    ...Default.args,
    state: "BUTTON_DISABLED",
    disabled: true,
  },
};

export const Loading = {
  args: {
    ...Default.args,
    state: "BUTTON_LOADING",
    loading: true,
  },
};

export const Pressed = {
  args: {
    ...Default.args,
    state: "BUTTON_PRESSED",
  },
};
