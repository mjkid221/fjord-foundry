import { prop } from "@typegoose/typegoose";

import { ClassBase } from "./class-base";

export class User extends ClassBase {
  @prop()
  public name?: string;
}
