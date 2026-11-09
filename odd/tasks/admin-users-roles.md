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
- [x] U2 API `PermissionGuard` + `@RequirePermission` on every admin controller; media picker any-of rule; coverage test (no admin route without permission).
- [x] U3 API users and roles modules (CRUD, protections, session revocation, audit).
- [x] U4 Admin web: nav/page gating, dashboard per permission, Usuarios and Roles pages (permission checklist grouped by area), account page shows role.
- [x] U5 Docs: ADR 0017, requirements 149 update, ADR 0008 note, security.md, admin-panel.md, api.md, README CLI.

## Acceptance criteria
API returns 403 for routes outside the role; nav shows only allowed modules; last-admin and self-demotion protections tested; sessions revoked on role change/disable; `pnpm typecheck`, `pnpm lint`, `pnpm test`, web build green; e2e admin login still passes.

## Delivery
Branch `feat/admin-users-roles` from `feat/owner-review-phase-a`. Forecast ~1,800 authored lines (5 work-unit commits). PR/merge decisions are the owner's.

## Progress / evidence
- U1 commit: `7243085` feat(auth): add role-based permission catalog and admin roles data model.
- U1 (route: delegated writer; trigger: 2+ non-trivial files across shared, schema, migration, auth, seed, CLI).
  - RED observed: `permissions.test.ts` (module missing), `admin-roles-migration.integration.spec.ts` (ENOENT migration.sql), `auth.service.spec.ts` + `authenticated-admin.spec.ts` (old payload), `create-admin.spec.ts` (3 failing: no role), integration suite (`Role "Administrador" does not exist` after TRUNCATE + seed).
  - GREEN: shared 62/62, API 160/160 (23 files, real `hotel_test` DB), web 440/440; `pnpm typecheck`, `pnpm lint` green; `prisma migrate status` up to date; `prisma migrate diff` (dev DB → schema) empty.
  - Design: migration creates `Role`, inserts the three seeded roles with stable ids `00000000-0000-7000-8000-00000000000{1,2,3}`, maps every admin to Administrador, drops `AdminRole`; partial unique index `Role_single_system_key` keeps one system role. Session resolution loads the role per request; the system role always yields the full catalog (`toAuthenticatedAdmin`). `seedBase` ensures roles (match by name or stable id; system permissions reset; ordinary roles never overwritten).

- U2 commit: `8f004c1` feat(auth): enforce role permissions on every admin route.
- U2 (route: delegated writer; trigger: 15 controller files + guard + tests).
  - RED observed: `permission.guard.spec.ts` (module missing); integration: route-coverage test listed 64 uncovered handlers, editor got 200 on `/admin/audit-logs`, content-only role got 200 on media PATCH.
  - GREEN: guard unit 7/7; API 170/170 (24 files).
  - Design: global guard order Throttler → SessionAuthGuard (session + CSRF) → PermissionGuard. `@RequirePermission(...anyOf)` (handler overrides class; class = `<area>.view`, writes = `<area>.manage`); `@AuthenticatedOnly()` on `AuthController` (own session/account/password); `@Public()` skips. Missing metadata → 403 `{ message: 'You do not have permission to perform this action.', code: 'PERMISSION_DENIED' }`. Media: GET list/by id = `media.view` or any `hotel|rooms|content.manage`; POST upload = `media.manage` or those; PATCH/DELETE = `media.manage`. Coverage test walks `ModulesContainer` controllers + `MetadataScanner` handlers with `PATH_METADATA` inside the integration suite (real DI graph).
- U3 commit: `858d76e` feat(admin): add users and roles management API.
- U3 (route: delegated writer; trigger: shared schemas + 2 API modules + integration tests).
  - RED observed: `users.test.ts` (module missing); 7 new integration tests failing (routes absent).
  - GREEN: shared 69/69, API 177/177 (24 files), web 440/440; `pnpm typecheck`, `pnpm lint`, web build green; Prettier clean on changed files; `prisma migrate status` up to date.
  - Size: ~880 authored lines (≈290 integration tests, ≈200 shared schemas + tests, ≈390 modules). Users and roles share error codes, fixtures and the sequential integration state, so they stay one work unit.
  - Design: `PATCH /admin/users/:id` runs in a transaction that locks the system role row (`SELECT ... FOR UPDATE`) before the last-Administrador count, so concurrent demotions cannot leave zero. Sessions are revoked after commit with `SessionService.revokeAllForUser` (deactivation and password reset are also rejected by session resolution). Role permission edits apply on the next request (role loaded per request). `users.manage` is effectively full control (it can create roles and users with any permission); grant it only to trusted roles.

- U4 commits: `05fad3b` feat(admin): gate panel navigation, pages and dashboard by role permissions; `5c5e76e` feat(admin): add Usuarios and Roles pages to the admin panel.
- U4 (route: delegated writer; trigger: 2+ non-trivial files across lib, shell, 16 pages, 2 new pages).
  - RED observed: `access.test.ts`, `permission-checklist.test.ts`, `session.test.ts` (modules missing); `form-errors.test.ts` 10 failing (PERMISSION_DENIED, 8 codes, password policy); `admin-shell.test.tsx` 6 failing (`visibleNav` missing, no notice); `dashboard.test.tsx` 4 failing (unconditional `/auth/me` and forbidden fetches); `users-manager.test.tsx` / `permission-checklist.test.tsx` (components missing).
  - GREEN: web 500/500 (54 files), shared 69/69, API 177/177 (real `hotel_test`); `pnpm typecheck`, `pnpm lint`, web build green (`/admin/users`, `/admin/roles` dynamic); Prettier clean on changed files.
  - Design: one route map `apps/web/lib/admin/access.ts` (mirrors the API metadata) drives nav filtering (`visibleNav`, empty groups hidden), `requirePermission` (`lib/admin/session.ts`, React `cache` for `/auth/me`; redirect to the first allowed section with `?acceso=denegado`, shell notice "Sección no disponible"; `/admin` redirects quietly) and the dashboard (each fetch only with its permission; readiness items/KPIs filtered by the permission of the page they link to; activity + metrics need `activity.view`; a role with only `dashboard.view` sees an explanatory notice). `/admin/room-types/new` requires `rooms.manage`. Cross-module reads verified against the API: rooms page (room types + amenities: `rooms.view`), nearby places (hotel: `hotel.view`), policies (FAQ: `content.view`), room type edit (amenities: `rooms.view`). Create/edit forms are inline panels (the admin design system has no create drawer; ResourceManager pattern), not dialogs.
  - Size: ~2,500 authored lines (≈1,250 tests). Gating and pages were split into two work units; each page/component carries its tests.
  - Pending: e2e not run (the web on :3000 is a stale Docker container); new e2e "a content editor sees only its sections…" creates and then deactivates a user (users are never deleted, so inactive e2e users accumulate in the dev DB).
- U5 (route: delegated writer, docs only): ADR 0017, requirements §3 roles paragraph, ADR 0008 note, security.md (unauthorized access row, tests), admin-panel.md (routes, permission table, errors, tests), api.md (permission conventions, `/auth/me` shape, users/roles endpoints and codes, room-type create `images`, rooms `amenityOverrides`, public amenity `availability`), README (`--role` in the scripts table). Structural readback + Prettier check only (passive docs).

## API contract for the web writer (U4)
- `GET /auth/me` / login / change-password: `user: { id, email, name, role: { id, name }, permissions: Permission[] }` (`AuthUser`; permissions already expanded, `manage` implies `view`). Helpers: `hasPermission`, `hasAnyPermission`, `PERMISSIONS`, `PERMISSION_AREAS`, `SYSTEM_ROLE_NAME` from `@hotel-bambu/shared`.
- 403 for missing permission: `{ statusCode: 403, error: 'Forbidden', message: 'You do not have permission to perform this action.', code: 'PERMISSION_DENIED' }`.
- Users (`users.view` for GET, `users.manage` for writes): `GET /admin/users` → `AdminUserSummary[]` `{ id, email, name, role: { id, name, isSystem }, active, lastLoginAt, createdAt }`; `POST /admin/users` body `adminUserCreateSchema` `{ email, name?, roleId, password }` → 201 summary; `PATCH /admin/users/:id` body `adminUserUpdateSchema` `{ name?, roleId?, active? }` → 200 summary; `POST /admin/users/:id/reset-password` body `{ password }` → 204.
- Roles (`users.view` / `users.manage`): `GET /admin/roles` → `AdminRoleSummary[]` `{ id, name, description, permissions, isSystem, userCount, createdAt, updatedAt }` (system first, then by name); `POST /admin/roles` body `roleCreateSchema` `{ name, description?, permissions }` → 201; `PATCH /admin/roles/:id` body `roleUpdateSchema` (partial) → 200; `DELETE /admin/roles/:id` → 204.
- Errors carry `code` + constant message (`ADMIN_USER_ERRORS` in shared): 422 `SELF_ROLE_CHANGE`, `SELF_DEACTIVATION`, `ROLE_NOT_FOUND`, `SYSTEM_ROLE_IMMUTABLE`; 409 `LAST_ADMINISTRATOR`, `EMAIL_TAKEN`, `ROLE_NAME_TAKEN`, `ROLE_IN_USE`; 422 `Password does not meet the policy.` with `details[{ path: 'password', code, message }]`; 400 validation as usual. Add the Spanish translations to `lib/forms/messages.ts`.
- Area → permission map used by the API: dashboard `dashboard.view`; hotel profile, nearby places, social links `hotel.*`; room types, rooms, amenities `rooms.*`; content sections, hero slides, gallery, policies, FAQ `content.*`; media library `media.*` (picker GET and upload also for `hotel|rooms|content.manage`); audit log + analytics `activity.view`; users + roles `users.*`.

## Next step
Feature complete pending the owner's review: run the e2e suite against a fresh web build (`pnpm e2e`, after recreating the web container), then PR/merge decisions (owner). Possible follow-up: hide write controls for view-only roles (today the API refuses and the panel shows "No tiene permiso para realizar esta acción.").
