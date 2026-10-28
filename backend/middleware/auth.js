function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to continue"
    });
  }

  next();
}

function requireRole(role) {
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

function createSession(req, user) {
  return new Promise((resolve, reject) => {
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

module.exports = { requireAuth, requireRole, createSession };
