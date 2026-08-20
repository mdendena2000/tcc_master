import "dotenv/config"
import { readFileSync } from "fs"
import { join } from "path"
import { pool } from "./pg"

async function migrate() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8")
  await pool.query(schema)
  console.log("Esquema aplicado com sucesso")
  await pool.end()
}

migrate().catch((error) => {
  console.error("Falha ao aplicar o esquema:", error)
  process.exit(1)
})