import { MaterialIcons } from "@expo/vector-icons";
import { Factory, View } from "native-base";
import { TextInput, TouchableOpacity } from "react-native";

export const Task = ({
  task: { id, title, state },
  onArchiveTask,
  onPinTask,
}: any) => (
  <TaskView>
    <TouchableOpacity onPress={() => onArchiveTask(id)}>
      {state !== "TASK_ARCHIVED" ? (
        <MaterialIcons
          name="check-box-outline-blank"
          size={24}
          color="#26c6da"
        />
      ) : (
        <MaterialIcons name="check-box" size={24} color="#26c6da" />
      )}
    </TouchableOpacity>
    <TaskTextInput
      placeholder="Input Title"
      value={title}
      editable={false}
      color={state === "TASK_ARCHIVED" ? "#aaa" : undefined}
      backgroundColor={state === "TASK_ARCHIVED" ? undefined : "transparent"}
    />
    <TouchableOpacity onPress={() => onPinTask(id)}>
      <MaterialIcons
        name="star"
        size={24}
        color={state !== "TASK_PINNED" ? "#eee" : "#26c6da"}
      />
    </TouchableOpacity>
  </TaskView>
);

const TaskView = Factory(View, {
  baseStyle: {
    flexDirection: "row",
    flexWrap: "nowrap",
    height: 48,
    width: "100%",
    backgroundColor: "white",
    alignItems: "center",
    paddingX: 10,
    justifyContent: "space-around",
  },
});

const TaskTextInput = Factory(TextInput, {
  baseStyle: {
    flex: 1,
    padding: 10,
    fontSize: 14,
  },
});
