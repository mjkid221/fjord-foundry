import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface TaskState {
  title: string;
}

/**
 * This is example code for how to create a zustand store. For use and implementation, see `ZustandTaskList` in "../components"
 */
export const useTaskStore = create<{
  tasks: TaskState[];
  addTask: (title: string) => void;
  removeTask: (title: string) => void;
}>()(
  devtools(
      (set) => ({
        // Initial state of tasks
        tasks: [],
        addTask: (newTitle: string) =>
          set((store) => ({
            tasks: [
              ...store.tasks,
              { title: newTitle },
            ],
          })),
        // Remove task from existing state
        removeTask: (title: string) =>
          set((store) => ({
            tasks: store.tasks.filter((task) => task.title !== title),
          })),
      }),
      {
        name: "task-storage",
      }
  )
);
