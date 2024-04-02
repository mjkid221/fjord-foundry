import { expect } from "chai";
import server from "nextjs-http-supertest";
import request from "supertest";

describe("/api/v1/example", () => {
  describe("GET /api/v1/example", () => {
    it("should return 200", async () => {
      const res = await request(server).get("/api/v1/example").query({
        firstNumber: 1,
        secondNumber: 2,
      });
      expect(res.status).to.equal(200);
    });

    it("should return the sum of the two numbers", async () => {
      const res = await request(server).get("/api/v1/example").query({
        firstNumber: 1,
        secondNumber: 2,
      });

      expect(res.body.result).to.equal(3);
    });

    it("should return a 400 on invalid query params", async () => {
      const res = await request(server).get("/api/v1/example").query({
        firstNumber: undefined,
        secondNumber: 2,
      });
      expect(res.status).to.equal(400);
    });
  });
});
