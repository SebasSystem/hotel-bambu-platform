# Admin users, roles and permissions

## Objective
Let the owner manage admin users and roles; each role grants permissions per admin module, and both the API and the admin UI enforce them.

## Problem / why
Owner request 2026-11-09. Today there is one role (`enum AdminRole { ADMIN }`), one global `SessionAuthGuard` and no permission check: every logged-in admin reaches every admin route. Admins exist only through the CLI (`pnpm admin:create`). The reservations module (later phase) will need a reception role.

## Scope (authorized)
Users, roles, permissions, admin UI gating, CLI role flag, docs. Out of scope: reservations (later phase, owner decides when).

## Evidence (explorer, 2026-11-09)
- `apps/api/prisma/schema.prisma:20-23` (`AdminRole`), `:99-116` (`AdminUser`), `:119-134` (`Session`), `:137-150` (`AuditLog`).
- Global guards `apps/api/src/app.module.ts:92-93`; `SessionAuthGuard` `modules/auth/session-auth.guard.ts:31-83`; `request-context.ts:4-9` role literal `'ADMIN'`; `shared/src/auth/auth.ts:31-35`.
- `createAdminUser` `modules/admin-users/create-admin.ts:25-66`; no admin-users controller.
- Admin nav static `components/admin/admin-shell.tsx:32-74`; session from `GET /auth/me` in `app/admin/(panel)/layout.tsx:14`.
- Media picker `GET /admin/media` used by gallery, hotel logo, room-type images, hero slides.
- `docs/requirements.md:149` says single admin role (needs update + new ADR); ADR 0008 stale on EDITOR.

## Decisions
- Permissions are a code catalog in `packages/shared` (one per admin area, `view` and `manage`; manage implies view): `dashboard`, `hotel` (hotel profile, nearby places, social links), `rooms` (room types, rooms, amenities), `content` (sections, hero slides, gallery, guest info: policies + FAQ), `media`, `activity` (audit log, analytics), `users` (users + roles). Account (own profile/password) is always allowed.
- Media picker dependency: `GET /admin/media` is allowed with `media.view` or any of `hotel.manage`, `rooms.manage`, `content.manage`; upload with `media.manage` or any of those.
- Roles are DB rows (`Role { id, name unique, description, permissions String[], isSystem }`); `AdminUser.roleId` replaces the enum. Seeded roles: Administrador (system, all permissions, not editable/deletable), Editor de contenido (hotel, rooms, content, media manage; dashboard view), Recepción (dashboard view; gains reservation permissions later). Migration maps existing admins to Administrador.
- API: a global `PermissionGuard` after `SessionAuthGuard` reads `@RequirePermission(...)` metadata (any-of). Admin routes without metadata are denied (a test asserts every non-public, non-auth route declares a permission).
- Users module: list, create (email, name, role, initial password per policy), update (name, role, active), reset password; no hard delete (disable). Blocks: disabling or demoting yourself, removing the last active Administrador. Role change, disable and password reset revoke the user's sessions. Everything audited.
- Roles module: list, create, edit name/description/permissions, delete only when unused; system role immutable. Permission changes take effect on the next request (role loaded per request); no session revocation needed for permission edits.
- `/auth/me` returns `role { id, name }` and the effective `permissions[]`. Admin nav and pages filter by permission; server pages gate with a helper (redirect to the first allowed page with a notice, or a 403 page). Dashboard fetches only what the user may see.
- CLI `admin:create --role <name>` (default Administrador).

## Tasks
- [x] U1 Shared permission catalog + Prisma `Role` model, migration (seed roles, map admins), `AdminUser.roleId`; session/`/auth/me` payload with role + permissions; CLI `--role`.
- [ ] U2 API `PermissionGuard` + `@RequirePermission` on every admin controller; media picker any-of rule; coverage test (no admin route without permission).
- [ ] U3 API users and roles modules (CRUD, protections, session revocation, audit).
- [ ] U4 Admin web: nav/page gating, dashboard per permission, Usuarios and Roles pages (permission checklist grouped by area), account page shows role.
- [ ] U5 Docs: ADR 0017, requirements 149 update, ADR 0008 note, security.md, admin-panel.md, api.md, README CLI.

## Acceptance criteria
API returns 403 for routes outside the role; nav shows only allowed modules; last-admin and self-demotion protections tested; sessions revoked on role change/disable; `pnpm typecheck`, `pnpm lint`, `pnpm test`, web build green; e2e admin login still passes.

## Delivery
Branch `feat/admin-users-roles` from `feat/owner-review-phase-a`. Forecast ~1,800 authored lines (5 work-unit commits). PR/merge decisions are the owner's.

## Progress / evidence
- U1 (route: delegated writer; trigger: 2+ non-trivial files across shared, schema, migration, auth, seed, CLI).
  - RED observed: `permissions.test.ts` (module missing), `admin-roles-migration.integration.spec.ts` (ENOENT migration.sql), `auth.service.spec.ts` + `authenticated-admin.spec.ts` (old payload), `create-admin.spec.ts` (3 failing: no role), integration suite (`Role "Administrador" does not exist` after TRUNCATE + seed).
  - GREEN: shared 62/62, API 160/160 (23 files, real `hotel_test` DB), web 440/440; `pnpm typecheck`, `pnpm lint` green; `prisma migrate status` up to date; `prisma migrate diff` (dev DB → schema) empty.
  - Design: migration creates `Role`, inserts the three seeded roles with stable ids `00000000-0000-7000-8000-00000000000{1,2,3}`, maps every admin to Administrador, drops `AdminRole`; partial unique index `Role_single_system_key` keeps one system role. Session resolution loads the role per request; the system role always yields the full catalog (`toAuthenticatedAdmin`). `seedBase` ensures roles (match by name or stable id; system permissions reset; ordinary roles never overwritten).

## Next step
U1–U3 (API) with one delegated writer after A11/A13 finish (shared schema/migration conflicts otherwise).
