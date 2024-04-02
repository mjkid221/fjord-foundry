## Unit and Integration Tests

### Unit Tests

- Scope: Unit tests focus on testing individual components, such as functions, methods, or classes, in isolation. They typically target small, independent units of code and aim to verify their behavior in isolation from other parts of the system.
- Dependencies: Unit tests usually mock or stub out external dependencies, such as databases, network services, or file systems, to isolate the unit being tested. This allows for more controlled and predictable testing of individual units.
- Purpose: The primary goal of unit testing is to validate that each unit of code performs as expected and meets its design requirements. It helps identify bugs or issues within specific units early in the development process.
- Benefits: Unit tests provide fast feedback during development, as they are generally quick to execute. They offer a level of confidence in the correctness of individual code units, making refactoring or modifications easier and less error-prone.

### Integration Tests

- Scope: Integration tests focus on testing the interaction and collaboration between multiple components or modules in a system. They verify that these components work together correctly and produce the expected results when integrated.
- Dependencies: Integration tests include the actual dependencies of the system, such as databases, web services, external APIs, or file systems. They aim to exercise the system in a more realistic environment, considering the interactions between different parts.
- Purpose: Integration tests help uncover issues that may arise when different components interact, such as communication problems, data inconsistencies, or integration failures. They ensure that the system's integrated parts function correctly as a whole.
- Benefits: Integration tests provide a higher level of confidence in the overall behavior and functionality of the system. They help catch integration issues, identify bugs introduced by the interaction of components, and validate the system's behavior against external dependencies.

## Writing and Running Tests

This is an example integration test written using the Mocha testing framework, Chai assertion library, and Supertest library. The test focuses on testing the /api/v1/example endpoint of a Next.js server. You can see this test in `/tests/example/example.test.ts`

```tsx
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
```

### Test Description

The test suite is organized using the describe function, which provides a container for related test cases. In this case, the test suite is titled "/api/v1/example" to reflect the endpoint being tested.

Within the test suite, there are three test cases, each represented by an it block:

1. **GET /api/v1/example should return 200:** This test case sends a GET request to the "/api/v1/example" endpoint with query parameters firstNumber and secondNumber set to 1 and 2, respectively. The test expects the server to respond with a 200 status code indicating a successful request.

2. **GET /api/v1/example should return the sum of the two numbers:** This test case sends a similar GET request as the previous one. It expects the server to respond with a JSON object containing a result field, which should be equal to the sum of firstNumber and secondNumber (in this case, 3).

3. **GET /api/v1/example should return a 400 on invalid query params:** This test case sends a GET request to the same endpoint but with an invalid query parameter. Specifically, the firstNumber is set to undefined while secondNumber is set to 2. The test expects the server to respond with a 400 status code indicating a bad request.

### Running the Tests

To run this test, you need to have the necessary dependencies installed (Mocha, Chai, and Supertest). These are already installed for you as dev dependencies. The next.js server will also run automatically at the start of the tests so you don't need to run it independently.

Run the tests using

```
yarn test
```

### Test Result Expectations

The test assertions, defined using the Chai assertion library, validate specific expectations about the server's responses:

1. The first test case expects a response with a 200 status code.
2. The second test case expects a response with a JSON object containing a result field equal to 3.
3. The third test case expects a response with a 400 status code.
   If any of the assertions fail during the test execution, an error message will be displayed, indicating which expectation was not met.

These tests aim to verify the behavior and correctness of the /api/v1/example endpoint, ensuring it returns the expected results and handles invalid input appropriately.
