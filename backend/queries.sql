-- ============================================================
-- Panel API — Queries de referencia
-- Conectar a: localhost:5432 / rxpanel / rxpanel_dba
-- ============================================================


-- ============================================================
-- USERS
-- ============================================================

-- Listar todos los usuarios
SELECT id, email, username, role, is_active, created_at
FROM users
ORDER BY created_at DESC;

-- Buscar usuario por email
SELECT id, email, username, role, is_active
FROM users
WHERE email = 'usuario@ejemplo.com';

-- Usuarios por rol
SELECT id, email, username, role
FROM users
WHERE role = 'admin';          -- 'admin' | 'viewer'

-- Activar / desactivar usuario
UPDATE users
SET is_active = false
WHERE email = 'usuario@ejemplo.com';

-- Cambiar rol de un usuario
UPDATE users
SET role = 'admin'
WHERE email = 'usuario@ejemplo.com';

-- Eliminar usuario
DELETE FROM users
WHERE email = 'usuario@ejemplo.com';


-- ============================================================
-- SITES
-- ============================================================

-- Listar sites activos con su dueño
SELECT
    s.id,
    s.name,
    s.url,
    s.status,
    s.is_ssl,
    s.is_active,
    u.email AS owner_email,
    s.created_at
FROM sites s
JOIN users u ON u.id = s.owner_id
WHERE s.is_active = true
ORDER BY s.created_at DESC;

-- Buscar site por URL
SELECT id, name, url, status, is_ssl, is_active
FROM sites
WHERE url = 'https://misitio.com';

-- Sites por estado
SELECT id, name, url, status
FROM sites
WHERE status = 'active';      -- 'active' | 'inactive' | 'maintenance' | 'error'

-- Sites de un usuario específico
SELECT s.id, s.name, s.url, s.status
FROM sites s
JOIN users u ON u.id = s.owner_id
WHERE u.email = 'usuario@ejemplo.com';

-- Cambiar estado de un site
UPDATE sites
SET status = 'maintenance'
WHERE url = 'https://misitio.com';

-- Soft delete (no borra el registro, solo lo oculta)
UPDATE sites
SET is_active = false
WHERE id = 1;

-- Eliminar site definitivamente
DELETE FROM sites
WHERE id = 1;


-- ============================================================
-- CHANGE LOGS
-- ============================================================

-- Historial completo con usuario y site
SELECT
    cl.id,
    cl.section,
    cl.change_type,
    cl.payload_snapshot,
    s.name  AS site_name,
    u.email AS user_email,
    cl.created_at
FROM change_logs cl
JOIN sites s ON s.id  = cl.site_id
JOIN users u ON u.id  = cl.user_id
ORDER BY cl.created_at DESC;

-- Historial de un site específico
SELECT cl.section, cl.change_type, cl.payload_snapshot, cl.created_at
FROM change_logs cl
WHERE cl.site_id = 1
ORDER BY cl.created_at DESC;

-- Filtrar por tipo de cambio
SELECT cl.section, cl.change_type, s.name AS site_name, cl.created_at
FROM change_logs cl
JOIN sites s ON s.id = cl.site_id
WHERE cl.change_type = 'update'   -- 'create' | 'update' | 'delete'
ORDER BY cl.created_at DESC;

-- Últimos 20 cambios
SELECT cl.section, cl.change_type, s.name AS site_name, u.email AS user_email, cl.created_at
FROM change_logs cl
JOIN sites s ON s.id = cl.site_id
JOIN users u ON u.id = cl.user_id
ORDER BY cl.created_at DESC
LIMIT 20;


-- ============================================================
-- REFRESH TOKENS
-- ============================================================

-- Tokens activos de un usuario
SELECT
    rt.id,
    rt.is_revoked,
    rt.expires_at,
    rt.created_at
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE u.email = 'usuario@ejemplo.com'
  AND rt.is_revoked = false;

-- Revocar todos los tokens de un usuario
UPDATE refresh_tokens
SET is_revoked = true
WHERE user_id = (
    SELECT id FROM users WHERE email = 'usuario@ejemplo.com'
);

-- Limpiar tokens expirados
DELETE FROM refresh_tokens
WHERE expires_at < NOW();


-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

-- Tokens de reset activos (no usados y no expirados)
SELECT
    prt.id,
    u.email,
    prt.is_used,
    prt.expires_at
FROM password_reset_tokens prt
JOIN users u ON u.id = prt.user_id
WHERE prt.is_used   = false
  AND prt.expires_at > NOW();

-- Invalidar tokens de reset de un usuario
UPDATE password_reset_tokens
SET is_used = true
WHERE user_id = (
    SELECT id FROM users WHERE email = 'usuario@ejemplo.com'
);

-- Limpiar tokens expirados o ya usados
DELETE FROM password_reset_tokens
WHERE is_used  = true
   OR expires_at < NOW();


-- ============================================================
-- ESTADÍSTICAS GENERALES
-- ============================================================

-- Resumen del sistema
SELECT
    (SELECT COUNT(*) FROM users  WHERE is_active = true)  AS usuarios_activos,
    (SELECT COUNT(*) FROM users  WHERE role = 'admin')    AS admins,
    (SELECT COUNT(*) FROM sites  WHERE is_active = true)  AS sites_activos,
    (SELECT COUNT(*) FROM sites  WHERE status = 'error')  AS sites_con_error,
    (SELECT COUNT(*) FROM change_logs)                    AS total_cambios;

-- Sites agrupados por estado
SELECT status, COUNT(*) AS total
FROM sites
WHERE is_active = true
GROUP BY status
ORDER BY total DESC;

-- Usuarios más activos (más cambios registrados)
SELECT u.email, COUNT(cl.id) AS cambios
FROM change_logs cl
JOIN users u ON u.id = cl.user_id
GROUP BY u.email
ORDER BY cambios DESC
LIMIT 10;
