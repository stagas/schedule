
build: components template index.js
	@component-build --dev

template:
	@component-convert template.html

components: component.json
	@component-install --dev

clean:
	rm -rf components build

.PHONY: clean
