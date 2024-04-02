import { useMutation } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import {
  ExampleRequest,
  ExampleResponse,
  baseApiInstance,
} from "../../../../api";

const postExample = async (
  body: ExampleRequest
): Promise<AxiosResponse<ExampleResponse>> =>
  baseApiInstance.post("/example", body);

/**
 * This example will send our two values (valueA and valueB) to the API to add them together and
 * return the result
 */
export const usePostExample = () => {
  const queryResponse = useMutation({
    mutationFn: postExample,
  });

  return queryResponse;
};
