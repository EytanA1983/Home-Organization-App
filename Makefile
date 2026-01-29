.PHONY: help install dev up down restart logs shell test lint format clean migrate makemigrations

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install Poetry and dependencies
	@echo "$(BLUE)Installing Poetry...$(NC)"
	@if ! command -v poetry &> /dev/null; then \
		curl -sSL https://install.python-poetry.org | python3 -; \
	fi
	@echo "$(BLUE)Installing dependencies...$(NC)"
	cd backend && poetry install

dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "Flower: http://localhost:5555"
	@echo "API Docs: http://localhost:8000/docs"

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-celery: ## Show Celery logs
	docker-compose logs -f celery-worker celery-beat

shell: ## Open shell in backend container
	docker-compose exec backend bash

shell-db: ## Open PostgreSQL shell
	docker-compose exec db psql -U user -d home_organization

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

test: ## Run tests
	docker-compose exec backend poetry run pytest tests/ -v

test-cov: ## Run tests with coverage
	docker-compose exec backend poetry run pytest tests/ -v --cov=app --cov-report=html

lint: ## Run linting
	docker-compose exec backend poetry run black --check app/
	docker-compose exec backend poetry run isort --check-only app/
	docker-compose exec backend poetry run flake8 app/
	docker-compose exec backend poetry run mypy app/

format: ## Format code
	docker-compose exec backend poetry run black app/
	docker-compose exec backend poetry run isort app/

migrate: ## Run database migrations
	docker-compose exec backend poetry run alembic upgrade head

makemigrations: ## Create new migration
	@read -p "Migration message: " msg; \
	docker-compose exec backend poetry run alembic revision --autogenerate -m "$$msg"

reset-db: ## Reset database (WARNING: deletes all data)
	@echo "$(YELLOW)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down -v; \
		docker-compose up -d db; \
		sleep 5; \
		docker-compose exec backend poetry run alembic upgrade head; \
		echo "$(GREEN)Database reset!$(NC)"; \
	fi

clean: ## Clean up containers, volumes, and cache
	docker-compose down -v
	docker system prune -f

build: ## Build all Docker images
	docker-compose build

rebuild: ## Rebuild all Docker images
	docker-compose build --no-cache

prod: ## Start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
