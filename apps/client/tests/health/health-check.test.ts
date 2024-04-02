import { expect } from "chai";
import server from "nextjs-http-supertest";
import request from "supertest";

describe("/api/v1/health", () => {
  describe("GET /api/v1/health", () => {
    it("should return 200", async () => {
      const res = await request(server).get("/api/v1/health");
      expect(res.status).to.equal(200);
    });

    it("should return an API Healthy message", async () => {
      const res = await request(server).get("/api/v1/health");
      expect(res.body.message).to.equal("API Healthy");
    });
  });
});
