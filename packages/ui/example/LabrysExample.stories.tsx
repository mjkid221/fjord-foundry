import { Box } from "@chakra-ui/react";
import type { Meta, StoryFn } from "@storybook/react";

import { LabrysExample, LabrysExampleProps } from "./LabrysExample";

export default {
  title: "Example/Labrys Example",
  component: LabrysExample,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Box maxW="md" mx="auto" p="16px">
        <Story />
      </Box>
    ),
  ],
} as Meta;

const Template: StoryFn<LabrysExampleProps> = (args) => (
  <LabrysExample {...args} />
);

export const StoryOne = Template.bind({});
StoryOne.args = {
  title: "This is a Labrys example story",
  color: "green.500",
};

export const StoryTwo = Template.bind({});
StoryTwo.args = {
  title: "This is another Labrys example story",
  color: "yellow.500",
};
