import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const isUnixSocket = dbHost.startsWith("/cloudsql/");

export default new DataSource({
  type: "postgres",
  host: dbHost,
  // Port is ignored for Unix socket connections
  port: isUnixSocket ? undefined : parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "erp",
  entities: ["dist/**/*.entity.js"],
  migrations: ["dist/migrations/*.js"],
  synchronize: false,
  logging: true,
  // Unix socket doesn't need SSL
  ssl: isUnixSocket ? false : undefined,
});
