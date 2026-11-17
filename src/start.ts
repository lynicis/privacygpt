import { createStart, createMiddleware } from "@tanstack/react-start"
import { checkAdminAuth } from "./lib/admin"

const adminBasicAuth = createMiddleware({ type: "request" }).server(
  ({ request, next }) => {
    if (new URL(request.url).pathname === "/admin") {
      try {
        checkAdminAuth(request.headers)
      } catch (error) {
        if (error instanceof Response) return error
        throw error
      }
    }
    return next()
  }
)

export const startInstance = createStart(() => ({
  requestMiddleware: [adminBasicAuth],
}))
