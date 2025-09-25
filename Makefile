# Makefile for htmz - JSON-powered HTML library

# Variables
SRC_DIR = src
DIST_DIR = dist
TEST_DIR = test
EXAMPLE_DIR = examples

# Source files
SOURCES = $(SRC_DIR)/utils.js \
          $(SRC_DIR)/parser.js \
          $(SRC_DIR)/request.js \
          $(SRC_DIR)/template.js \
          $(SRC_DIR)/dom.js \
          $(SRC_DIR)/event.js \
          $(SRC_DIR)/env.js \
          $(SRC_DIR)/htmz.js

# Build targets
TARGET = $(DIST_DIR)/htmz.js
TARGET_MIN = $(DIST_DIR)/htmz.min.js

.PHONY: all build dev test clean install

all: build

build: $(TARGET) $(TARGET_MIN)

$(TARGET): $(SOURCES) | $(DIST_DIR)
	cat $(SOURCES) > $@

$(TARGET_MIN): $(TARGET)
	# Minify using basic sed for now - can be enhanced later
	sed -e 's/\/\*[^*]*\*\///g' -e 's/  */ /g' -e 's/^ *//g' -e '/^$$/d' $< > $@

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

dev: build
	./bin/htmz dev

test: build
	@echo "Running htmz security test suite..."
	node tests/security-test.js

clean:
	rm -rf $(DIST_DIR)

install: build
	npm install -g .

# Development helpers
watch:
	@echo "Watching for changes..."
	while true; do \
		inotifywait -e modify $(SOURCES) && $(MAKE) build; \
	done