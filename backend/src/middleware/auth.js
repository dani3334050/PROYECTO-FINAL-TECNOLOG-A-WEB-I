/**
 * Middlewares de Autenticación y Autorización basados en Sesiones y Cookies
 */

export function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Sesión no activa o expirada. Por favor inicie sesión.'
    });
  }
  req.user = req.session.user;
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: 'Sesión no activa. Por favor inicie sesión.'
      });
    }

    req.user = req.session.user;
    const userRole = req.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Este recurso requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}
