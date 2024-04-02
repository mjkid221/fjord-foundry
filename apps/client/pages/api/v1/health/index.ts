import { HealthCheckResponse, apiHandler } from "@scope/lib";
import { NextApiResponse } from "next/types";

export default apiHandler()
  /**
   * Health Check API Route
   * @route GET /api/v1/health
   */
  .get(async (_, res: NextApiResponse<HealthCheckResponse>) =>
    res.status(200).send({ message: "API Healthy" })
  );
