import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import tsconfigPaths from "vite-tsconfig-paths"
import type { Plugin } from "vite"

// Store matrix state
let matrix = Array(5)
  .fill(0)
  .map(() => Array(3).fill(0))

// Custom API plugin
function matrixApiPlugin(): Plugin {
  return {
    name: "matrix-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/matrix/update" && req.method === "POST") {
          let body = ""
          req.on("data", (chunk) => {
            body += chunk
          })
          req.on("end", () => {
            try {
              matrix = JSON.parse(body)
              res.end(JSON.stringify({ success: true }))
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: "Invalid matrix data" }))
            }
          })
          return
        }

        if (req.url === "/api/matrix/get" && req.method === "GET") {
          res.end(JSON.stringify(matrix))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tsconfigPaths(), matrixApiPlugin()],
  server: {
    port: 5173,
    open: true,
  },
})
