import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      user_type: "child" | "caregiver";
    };
  }
}
