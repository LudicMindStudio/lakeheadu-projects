# lakeheadu-projects

Three standalone web applications built for Lakehead University partners.

- `framework/` — interactive decision framework for evaluating digital mental health technologies
- `resources/` — searchable database of mental health resources and tools
- `services/` — searchable directory of mental health services in Northwestern Ontario

Each app is fully independent: its own dependencies, its own build, its own dev server.

## Running an app

    cd <app>          # framework | resources | services
    npm install
    npm run dev

## Scripts

Every app supports:

    npm run dev       start the Vite dev server
    npm run build     production build to dist/
    npm run preview   serve the production build
    npm run lint      run oxlint
    npm run format    run Prettier
    npm test          run the test suite

## Layout

    framework/  resources/  services/   the three apps
    docs/                               notes and decisions
