import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import {
  ExampleRequest,
  ExampleResponse,
  baseApiInstance,
} from "../../../../api";

export const GetExampleQueryKey = "get-example";

const getExample = async (
  params: ExampleRequest
): Promise<AxiosResponse<ExampleResponse>> =>
  baseApiInstance.get("/example", { params });

/**
 * This query will fetch the result of the `/example` API route
 * Because the query key is dynamic, it will refetch when the value of `valueA` or `valueB` changes
 * @param valueA
 * @param valueB
 */
export const useGetExample = (params: ExampleRequest) => {
  const { data, ...queryResponse } = useQuery({
    queryKey: [GetExampleQueryKey, params.firstNumber, params.secondNumber],
    queryFn: () => getExample(params),
    keepPreviousData: false,
  });

  // Extract the result from the response like this is optional.
  // It can be useful if you have a default value that you want to use if the result is undefined.
  const result = data?.data.result;

  return {
    result,
    ...queryResponse,
  };
};
