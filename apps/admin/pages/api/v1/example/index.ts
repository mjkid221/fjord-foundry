import { ExampleResponse, apiHandler, exampleRequestSchema } from "@scope/lib";
import { NextApiRequest, NextApiResponse } from "next/types";

/**
 * This is a test sleep function to simulate the API taking some time to respond.
 * Without this, the API would respond instantly and you wouldn't be able to see the loading state.
 *
 * @param ms The number of milliseconds to sleep for
 */ // eslint-disable-next-line no-promise-executor-return -- Sleep for demo purposes
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default apiHandler()
  /**
   * This is an example of a GET request for some data. It takes two number, adds them together, and returns the result.
   * The parameters for a GET request are pulled from the request query.
   *
   * @route GET /api/v1/example
   */
  .get(async (req: NextApiRequest, res: NextApiResponse<ExampleResponse>) => {
    const { firstNumber, secondNumber } = exampleRequestSchema.parse(req.query);

    await sleep(1000);

    const result = firstNumber + secondNumber;

    return res.status(200).send({ result });
  })

  /**
   * The is an example of a POST request that should do something and return a response.
   * The parameters for a POST or PATCH request are pulled from the request body.
   *
   * @route POST /api/v1/example
   */
  .post(async (req: NextApiRequest, res: NextApiResponse<ExampleResponse>) => {
    const { firstNumber, secondNumber } = exampleRequestSchema.parse(req.body);

    await sleep(1000);

    // A POST request is usually intended to create a new resource, but for now we'll just add the two numbers together and return the result.
    const result = firstNumber + secondNumber;

    return res.status(200).send({ result });
  });
