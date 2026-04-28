# Origin Raid Planner UI

Origin Raid Planner UI is the Angular frontend for **Origin Raid Planner**, a raid planning and officer workflow application built for World of Warcraft guild management.

This frontend focuses on usability for officers: weekly raid navigation, roster composition, Discord publication workflows, reminder tooling, and comparison views that help balance multiple raids across the same reset cycle.

## Scope

This repository contains the client application only.

Main responsibilities:

- officer authentication flow integration with the backend
- weekly raid planning views
- drag-and-drop composition building
- roster and character management interfaces
- raid template administration
- publication, confirmation, and reminder dashboards
- compact reference views for cross-raid comparison

The backend API, infrastructure, and deployment scripts live in the main repository:

- [Origin Raid Planner backend repository](https://github.com/origin-finkle/RaidPlanner)

## Tech Stack

- Angular 19
- TypeScript
- SCSS
- Angular CDK
- ng-bootstrap
- ng-select
- SortableJS

## Product Highlights

This frontend was designed for an operational use case rather than a generic admin panel.

Notable UI concerns handled here:

- navigating raids on a `Wednesday -> Tuesday` guild reset cycle
- composing two raid groups visually
- surfacing class/spec information clearly enough for quick officer decisions
- comparing a current raid against another prepared raid
- supporting both automated weekly raids and one-off manual raids
- keeping Discord publication and validation steps close to composition workflows

## Project Structure

- [`src/app/`](./src/app): application features, shared components, and core services
- [`src/app/features/`](./src/app/features): raid planning, admin, and officer workflows
- [`src/app/core/`](./src/app/core): models, guards, services, and application infrastructure
- [`docker/`](./docker): frontend runtime configuration
- [`Dockerfile`](./Dockerfile): production image build

## Local Development

### Prerequisites

- Node.js
- npm
- backend API running locally or remotely

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

The app is then available at:

- [http://localhost:4200](http://localhost:4200)

## Build

```bash
npm run build
```

Production assets are generated in `dist/`.

## Notes

- this repository is used as a Git submodule inside the main `RaidPlanner` repository
- frontend-only changes should be committed here first, then the root repository should be updated to point to the new frontend commit

## Current Direction

The frontend is already feature-rich and production-oriented. The most relevant next improvements are:

- more visual refinement for officer-heavy workflows
- stronger automated UI test coverage
- continued simplification of advanced admin actions
