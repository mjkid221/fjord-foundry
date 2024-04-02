import { Flex, Text, Button, Input } from "@chakra-ui/react";
import { useState } from "react";

import { useTaskStore } from "../stores";

const ZustandTaskList = () => {
  const [value, setValue] = useState<string>();
  const { tasks, addTask, removeTask } = useTaskStore();

  return (
    <Flex flexDirection="column" width="60%" alignSelf="center" height="50vh" justifyContent="space-around">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="New task name"
      />
      <Button
        onClick={() => {
          if (!value) {
            return;
          }
          addTask(value);
        }}
      >
        Add Task
      </Button>
      {tasks.map((task) => (
        <Flex key={task.title} width="300px" justifyContent="space-between">
          <Text>{task.title}</Text>
          <Button onClick={() => removeTask(task.title)}>Remove Task</Button>
        </Flex>
      ))}
    </Flex>
  );
};

export default ZustandTaskList;
