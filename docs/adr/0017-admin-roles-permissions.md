# 0017 — Admin roles and permissions

- Status: Accepted
- Date: 2026-11-09
- Amends: [0008](0008-auth-sessions-csrf.md) (authorization), [0016](0016-room-types-and-single-sources.md)
  (the EDITOR role it removed returns as an editable role row)
- Supersedes: requirement 9 "único rol de administrador" ([requirements](../requirements.md))

## Context

Until now there was one role (`enum AdminRole { ADMIN }`), one global `SessionAuthGuard` and no
permission check: every signed-in admin could call every admin route. Admins could only be created
from the CLI. On 2026-11-09 the owner asked to manage admin users and roles from the panel, with
each role limited to some admin areas. The reservations phase (not started) will need a reception
role on top of that.

## Decision

**Permission catalog in code.** `packages/shared/src/auth/permissions.ts` defines one permission
per admin area and level, `<area>.view` and `<area>.manage`; `manage` implies `view`
(`expandPermissions`). A role stores a list of these keys; unknown keys are dropped.

| Area | Covers | Panel label |
|---|---|---|
| `dashboard` | Resumen page and `GET /admin/dashboard` | Resumen |
| `hotel` | Hotel profile, nearby places, social links | Datos del hotel |
| `rooms` | Room types, rooms, amenities | Habitaciones |
| `content` | Home sections, hero slides, gallery, policies, FAQ | Contenido |
| `media` | Media library | Fotos y medios |
| `activity` | Audit log and analytics summary | Actividad |
| `users` | Admin users and roles | Usuarios y roles |

The own account (`/auth/me`, change password, logout) needs no permission.

**Roles are rows.** `Role { id, name (unique), description, permissions String[], isSystem }`;
`AdminUser.roleId` replaces the enum. Seeded with stable ids: **Administrador** (system role:
always the full catalog, cannot be edited or deleted; a partial unique index keeps a single system
role), **Editor de contenido** (manage hotel, rooms, content, media; view dashboard) and
**Recepción** (view dashboard; gains reservation permissions later). The migration maps every
existing admin to Administrador. The role is loaded on every request, so permission edits apply on
the user's next request without revoking sessions.

**Guard order.** Global guards run Throttler → `SessionAuthGuard` (session, then CSRF) →
`PermissionGuard`. Handlers declare `@RequirePermission(...anyOf)` (a handler decorator overrides
the class one; reads use `<area>.view`, writes `<area>.manage`); `@AuthenticatedOnly()` marks the
auth controller; `@Public()` skips both. An admin route without metadata is denied, and an
integration test walks every controller handler to assert that each non-public route declares a
permission. A denial answers `403 { code: 'PERMISSION_DENIED' }`.

**Media any-of.** The media picker is used by forms of other areas (hotel logo, room type images,
hero slides, gallery). `GET /admin/media` and `GET /admin/media/:id` accept `media.view` or any of
`hotel.manage`, `rooms.manage`, `content.manage`; `POST /admin/media` accepts `media.manage` or any
of those three. Editing or deleting library entries needs `media.manage`.

**Protections** (users module): nobody changes their own role or deactivates themselves
(`SELF_ROLE_CHANGE`, `SELF_DEACTIVATION`); at least one active user keeps the system role
(`LAST_ADMINISTRATOR`, checked inside a transaction that locks the system role row); the system
role is immutable (`SYSTEM_ROLE_IMMUTABLE`); a role with users cannot be deleted (`ROLE_IN_USE`).
Users are never hard-deleted, only deactivated. Role change, deactivation and password reset revoke
the user's sessions. Every change is audited.

**Admin panel.** One route-to-permission map (`apps/web/lib/admin/access.ts`) drives the
navigation (items and empty groups hidden), the server page gate `requirePermission` (redirects to
the first allowed section with `?acceso=denegado`, explained by a notice) and the dashboard, which
fetches and shows each widget only with its permission. The panel is a convenience: the API stays
the authority.

**CLI.** `admin:create --role <name>` picks the role of a new admin (default Administrador).

## Consequences

- `users.manage` is effectively full control: it can create roles and users with any permission.
  Grant it only to trusted people; the roles page warns about it.
- A view-only role sees the edit controls of its pages; writes are refused by the API with
  `PERMISSION_DENIED` and the panel shows "No tiene permiso para realizar esta acción.".
- Every new admin endpoint must declare a permission, or the coverage test fails.
- New areas (reservations) add catalog keys; existing roles do not gain them until edited.
