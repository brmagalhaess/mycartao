.PHONY: up down build logs health test test-local

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

health:
	curl -s http://localhost:8000/health

test:
	docker compose exec backend pytest -v

# Hosts without Docker: uses backend/.venv if present, else PATH python.
test-local:
	cd backend && (test -x .venv/bin/python && .venv/bin/python -m pytest -v || python -m pytest -v)
