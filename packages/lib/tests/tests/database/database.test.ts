import { expect } from "chai";

import { UserModel } from "../../../database/models";
import { MockMemoryServer } from "../../mocks";

describe("database example test", () => {
  const name = "John Smith";

  beforeEach(async () => {
    // Clear the database before each test
    await MockMemoryServer.clean();
  });

  it("should create a new user document", async () => {
    expect(await UserModel.countDocuments()).to.equal(0);
    await UserModel.create({ name });
    expect(await UserModel.countDocuments()).to.equal(1);
  });

  it("should find the user document", async () => {
    expect(await UserModel.findOne({ name })).to.equal(null);

    await UserModel.create({ name });

    const newUser = await UserModel.findOne({ name });
    expect(newUser).to.not.equal(undefined);
    expect(newUser?.name).to.equal(name);
  });
});
