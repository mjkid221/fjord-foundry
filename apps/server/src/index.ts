import "@total-typescript/ts-reset";
import { connect } from "@scope/lib/database/utils";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes";

connect();

const port = process.env.PORT || 3030;

const app = express();

// add middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// listen to provided port
app.listen(port, () => {
  console.log(`The application is listening on port ${port}`);
});

app.use(routes);
