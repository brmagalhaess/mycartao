.PHONY: up down build logs health

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
