# Build the site
build:
    bash build.sh

# Serve the built site (static preview)
serve: build
    npx serve site/build

# Start dev server with HMR
dev:
    cd site && npm run dev
