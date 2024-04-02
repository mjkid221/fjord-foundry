import { View } from "react-native";

import * as StoryBook from "@/.storybook";

const StoryBookScreen = () => {
  const StorybookUI = StoryBook.default;

  return (
    <View style={{ flex: 1 }}>
      <StorybookUI />
    </View>
  );
};

export default StoryBookScreen;
