import { getModelForClass } from "@typegoose/typegoose";

import { User } from "../classes";

export const UserModel = getModelForClass(User);
