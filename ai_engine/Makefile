test:
	docker compose exec gateway pytest tests/test_gateway.py -s -qs

up:
	docker compose up -d

build:
	docker compose up --build -d

exper:
	docker compose exec gateway python scripts/run_experiment.py

exper-l1:
	docker compose exec gateway python scripts/run_experiment.py --layer 1

ollama-pull:
ifndef model
	$(error Missing ollama model. Use: make ollama-pull model="model name")
endif
	docker compose exec ollama ollama pull $(model)

ollama-rm:
ifndef model
	$(error Missing ollama model. Use: make ollama-rm model="model name")
endif
	docker compose exec ollama ollama rm $(model)

ollama-list:
	docker compose exec ollama ollama list