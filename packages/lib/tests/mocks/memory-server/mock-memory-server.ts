import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

/**
 * In memory MongoDB server for integration testing
 */
export class MockMemoryServer {
  public static server?: MongoMemoryServer;

  public static connection?: typeof mongoose;

  /**
   * Start the in memory server -- if one is already running, nothing will happen
   */
  static async start() {
    if (this.server) return;

    this.server = await MongoMemoryServer.create();
    const uri = this.server.getUri();
    this.connection = await mongoose.connect(uri);
  }

  /**
   * Stop the in memory server. This should be called at the end of every test
   */
  static async stop() {
    await this.connection?.disconnect();
    await this.server?.stop();
  }

  /**
   * Drop everything from the memory server. This should be called at the beginning of every test
   */
  static async clean() {
    return this.connection?.connection.db.dropDatabase();
  }

  /**
   * Get the URI of the in memory server
   */
  static getUri() {
    if (!this.server) throw new Error("Server not started");
    return this.server?.getUri();
  }

  /**
   * Connect to the in memory server
   */
  static async connect() {
    if (!this.server) throw new Error("Server not started");
    const uri = this.getUri();
    return mongoose.connect(uri);
  }
}
