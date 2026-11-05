# Production shortcuts for the VPS (needs only Docker + make; pnpm users: `pnpm prod:*`).
# Guide: deploy/README.md. Override the env file with `make up ENV_FILE=path`.
ENV_FILE ?= deploy/.env.production
DC := docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE)

.PHONY: help config build up down ps logs backup restore seed admin media-import update

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-13s %s\n", $$1, $$2}'

config: ## Validate the compose file + env file
	$(DC) config --quiet

build: ## Build the production images
	$(DC) build

up: ## Start (or update) the stack; migrations run first
	$(DC) up -d --wait

down: ## Stop the stack (volumes are kept)
	$(DC) down

ps: ## Service status
	$(DC) ps -a

logs: ## Follow logs (make logs S=api)
	$(DC) logs -f --tail=200 $(S)

backup: ## Run a backup now
	$(DC) exec backup backup.sh

restore: ## Restore a dump: make restore FILE=/backups/db/<file>.dump
	@test -n "$(FILE)" || (echo "usage: make restore FILE=/backups/db/<file>.dump" && exit 1)
	$(DC) stop web api
	$(DC) exec backup restore.sh $(FILE)
	$(DC) up -d --wait

seed: ## Idempotent base seed (never demo data)
	$(DC) run --rm api node dist/scripts/seed-base.js

admin: ## Create an administrator interactively
	$(DC) run --rm api node dist/scripts/admin-create.js

media-import: ## One-time photo import: make media-import PHOTOS=/srv/hotel-photos
	@test -n "$(PHOTOS)" || (echo "usage: make media-import PHOTOS=/absolute/path/to/photos" && exit 1)
	$(DC) run --rm -v $(PHOTOS):/import/photos:ro api node dist/scripts/media-import.js

update: ## git pull + rebuild + restart
	git pull --ff-only
	$(DC) build
	$(DC) up -d --wait
