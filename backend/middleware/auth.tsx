import type { NextFunction, Request, Response } from "express";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to continue"
    });
  }

  next();
}

function requireRole(role: "child" | "caregiver") {
  return (req, res, next) => {
    if (req.session.user.user_type !== role) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource"
      });
    }

    next();
  };
}

function createSession(req: Request, user: { id: number; user_type: "child" | "caregiver" }) {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return reject(regenerateError);
      }

      req.session.user = {
        id: user.id,
        user_type: user.user_type
      };

      req.session.save((saveError) => {
        if (saveError) {
          return reject(saveError);
        }

        resolve();
      });
    });
  });
}

export { requireAuth, requireRole, createSession };
