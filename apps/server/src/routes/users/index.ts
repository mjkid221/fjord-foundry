import { Router } from "express";

import createUser from "./createUser";
import getUsers from "./getUsers";

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);

export default router;
