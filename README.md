# Pressure Vessel Dished End Calculator

A React + Vite utility application for estimating the geometry, blank size, weight, visual layout, and printable QC report of pressure vessel dished ends.

This project is the modular application version of the original single-file calculator stored in `app.html`. The old file remains in the repository as the functional baseline, while the current app is implemented in typed, maintainable source modules under `src/`.

## Overview

The calculator is intended for quick engineering-oriented configuration of formed dished ends based on:

- `DIN 28011`
- `DIN 28013`
- `SS 895`

The application lets the user:

- choose a supported head standard
- define outer diameter, wall thickness, straight flange, and material
- define weld edge preparation parameters
- add and position nozzles on the head sketch
- preview the head profile in SVG
- review derived manufacturing values
- estimate the circular blank, minimum square sheet, and forming thickness map
- generate a print-friendly QC / manufacturing report
- generate a print-friendly blank cutting report

The goal of this refactor is to preserve the behavior of the original calculator while making the code easier to extend, validate, test, and deploy.

## User Guide

### 1. Select the head standard

The first section of the application allows the user to choose between:

- `DIN28011`
- `DIN28013`
- `SS895`

The selected standard controls the geometry formulas used for:

- crown radius `R`
- knuckle radius `r`
- dish depth `h2`
- blank diameter factor

### 2. Enter the main geometry

In the `Geometry & Material` panel the user provides:

- `Diameter (Da)` in mm
- `Thickness (s)` in mm
- `Straight Flange (h1)` in mm
- material selection

These values are the main input parameters for the geometry and weight estimation.

### 3. Configure weld edge preparation

The `Weld Edge Prep` panel supports:

- `None (Square Cut)`
- `V-Bevel (Outside)`

When `V-Bevel` is selected, two more parameters become active:

- bevel angle
- root face

These values affect the rendered section profile and are also shown in the report.

### 4. Add nozzles

The `Nozzles` panel allows the user to create simple nozzle markers for layout visualization.

Each nozzle contains:

- nominal size, such as `DN50`
- horizontal offset from the centerline

Nozzles are displayed in the SVG preview and also appear in the printed report sketch.

### 5. Review calculated output

When inputs are valid, the application computes and displays:

- crown radius `R`
- knuckle radius `r`
- dish depth `h2`
- total height `H`
- estimated blank diameter
- required circular blank diameter
- minimum and recommended square sheet size
- estimated forming thickness by zone
- estimated weight
- approximate volume
- tolerance values

### 6. Review blank and forming estimate

The `Blank & Forming Assumptions` panel controls the production-planning estimate for the blank.

The module uses:

- radial trim allowance, with an automatic default of `max(10 mm, 0.005 * Da)`
- cutting clearance per side
- rounding step for sheet and disc sizes

The live blank module shows:

- required circular blank diameter
- minimum square sheet size
- recommended square sheet size
- estimated square-sheet waste
- estimated minimum thickness zone
- advisory starting thickness if the target is to retain nominal thickness after forming

The thickness map is an engineering v1 estimate only. It is intended for planning and supplier discussion, not for certified forming simulation or pressure-vessel code verification.

### 7. Generate reports

The `QC Report (PDF)` button opens a print-oriented report view and automatically triggers the browser print dialog when possible.

The report includes:

- design data
- nominal dimensions
- visual section sketch
- QC measurement table
- tolerance references
- signature placeholders

The `Blank Report (PDF)` button opens a separate print-oriented blank report with blank sizing assumptions, a circular blank and square sheet table, a cutting map, an estimated thickness map, warnings, and signature placeholders.

## Validation Behavior

The app does not silently accept invalid engineering input.

Validation currently checks:

- outer diameter must be greater than zero
- thickness must be greater than zero
- thickness must remain below half of the outer diameter
- straight flange must be at least `10 mm`
- bevel angle must be between `0` and `90` degrees when bevel mode is enabled
- root face must be greater than zero and smaller than thickness
- nozzle offsets must stay within the available visual span of the head
- blank trim allowance and cutting clearance must be zero or greater
- blank rounding step must be greater than zero

When a value is invalid:

- the validation panel shows the problem
- the engineering preview is paused
- report generation is disabled

Invalid blank assumptions pause only the blank module and blank report. The main engineering preview and QC report remain available when the head geometry and nozzle inputs are valid.

## Engineering Logic

The core engineering formulas are preserved from the legacy implementation.

### Supported standards

#### DIN 28011

- `R = Da`
- `r = 0.1 * Da`
- `h2 = 0.1935 * Da - 0.455 * s`
- blank diameter factor = `1.09`

#### DIN 28013

- `R = 0.8 * Da`
- `r = 0.154 * Da`
- `h2 = 0.255 * Da - 0.635 * s`
- blank diameter factor = `1.14`

#### SS 895

- `R = Da`
- `r = 0.1 * Da`
- `h2 = 0.1935 * Da`
- blank diameter factor = `1.09`

### Derived values

The application also computes:

- `totalHeight = h1 + h2 + s`
- `blankDiameter = factor * Da + 2 * h1`
- approximate blank area from the blank diameter
- estimated material volume from area and thickness
- estimated weight using simple density rules
- approximate vessel volume using the legacy simplified method

### Blank sizing and thickness estimate

The blank module keeps the legacy `blankDiameter` as the base flat blank diameter, then applies manufacturing allowances:

```text
requiredDiscDiameter = roundUp(baseBlankDiameter + 2 * trimAllowanceRadial, roundingStep)
minimumSquareSheetSide = requiredDiscDiameter
recommendedSquareSheetSide = roundUp(requiredDiscDiameter + 2 * cuttingClearance, roundingStep)
```

The v1 thickness estimate treats the entered `s` as starting sheet thickness and applies default forming reductions by zone:

- `DIN28011` / `SS895`: crown `-3%`, crown shoulder `-7%`, knuckle `-12%`, straight flange `-4%`
- `DIN28013`: crown `-4%`, crown shoulder `-8%`, knuckle `-14%`, straight flange `-5%`

If the estimated minimum thickness drops below the QC minimum `s - 0.3 mm`, the app shows a warning in the module and blank report.

### Material density assumption

Weight estimation currently uses:

- `4.51` for materials whose name contains `Titanium`
- `7.8` for materials whose name contains `Duplex`
- `7.9` for materials whose name contains `Stainless`
- `7.85` for all other supported pressure-vessel steels

This is still a simplified material density model and should be checked against project-specific material certificates for released manufacturing data.

## Project Structure

```text
pressure-vessel-dished-end-calc/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── app.html
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── styles.css
    ├── constants.ts
    ├── types.ts
    ├── components/
    │   ├── BlankModulePanel.tsx
    │   ├── BlankReportView.tsx
    │   ├── Field.tsx
    │   ├── Icon.tsx
    │   ├── PreviewPanel.tsx
    │   ├── ReportView.tsx
    │   └── SvgDimension.tsx
    └── lib/
        ├── blankCalculations.ts
        ├── calculations.ts
        ├── drawing.ts
        └── validation.ts
```

## Main Files And Responsibilities

### `app.html`

The original standalone calculator. It is kept as a reference implementation for migration parity and legacy behavior comparison.

### `index.html`

The Vite entry HTML that mounts the React application.

### `src/main.tsx`

The client bootstrap file. It mounts the root React component into the DOM.

### `src/App.tsx`

The main application container.

Primary responsibilities:

- stores form state
- stores blank assumption state
- stores nozzle list state
- runs validation through `validateForm`
- runs calculations through `calculateGeometry`
- runs blank sizing through `calculateBlank`
- computes approximate volume
- toggles the QC and blank report views
- triggers browser printing
- composes the user interface panels

### `src/constants.ts`

Application constants and defaults.

Contains:

- `APP_VERSION`
- supported material list
- supported nozzle sizes
- default calculator form values
- default blank assumption form values
- default nozzle values

### `src/types.ts`

Central TypeScript contracts for the application.

Defines:

- calculator form types
- blank option and blank calculation result types
- parsed calculator config type
- nozzle types
- calculation result type
- tolerance type
- validation result type

### `src/lib/calculations.ts`

The core engineering calculation module.

Main functions:

- `getTolerances(diameterOuter)`
  Returns dimensional tolerance data used by the report.

- `calculateGeometry(config)`
  Calculates geometry, blank diameter, weight, and tolerances from validated input.

- `calculateApproxVolume(config, totalHeight)`
  Returns the legacy approximate volume estimate shown in the UI.

### `src/lib/blankCalculations.ts`

The blank sizing and forming estimate module.

Main functions:

- `getDefaultTrimAllowance(diameterOuter)`
  Returns the automatic radial trim allowance.

- `roundUpToStep(value, step)`
  Rounds manufacturing dimensions upward to the configured increment.

- `calculateBlank(config, calculated, options)`
  Calculates circular blank size, square sheet size, waste, blank weights, estimated thickness zones, advisory starting thickness, and warnings.

### `src/lib/validation.ts`

The input validation and parsing layer.

Main function:

- `validateForm(form, nozzleForms)`

Responsibilities:

- parses user-entered strings into numbers
- checks engineering constraints
- validates blank module assumptions
- validates nozzle offsets
- creates a safe parsed config object
- returns structured errors for the UI

### `src/lib/drawing.ts`

The SVG drawing utility layer.

Main functions:

- `getDrawingMetrics(config, calculated)`
  Prepares view box and scaling values for screen and print rendering.

- `getHeadPath(config, calculated, center)`
  Builds the SVG path string for the dished-end cross section.

- `getNozzleDrawing(nozzle, index, config, calculated, center)`
  Converts nozzle data into SVG rectangle coordinates and label metadata.

### `src/components/Field.tsx`

Reusable form field helpers.

Contains:

- `Field`
- `NumberField`

These components keep labels, errors, and number input formatting consistent across the UI.

### `src/components/Icon.tsx`

Inline SVG icon library used by the interface.

### `src/components/SvgDimension.tsx`

Reusable SVG dimension annotation component.

Used to draw:

- extension lines
- arrows
- dimension labels
- horizontal and vertical measurement markers

### `src/components/PreviewPanel.tsx`

The main engineering preview.

Responsibilities:

- renders the dished-end SVG profile
- renders nozzle markers
- renders dimension annotations
- shows quick numeric summary cards

### `src/components/BlankModulePanel.tsx`

The live blank and thickness module.

Responsibilities:

- renders the cutting map
- renders the estimated thickness map
- shows blank sizing, waste, weight, and minimum thickness metrics
- shows warning messages for planning risk

### `src/components/ReportView.tsx`

The printable manufacturing / QC report view.

Responsibilities:

- renders a print toolbar
- renders report header and metadata
- renders design and dimension tables
- renders the black-and-white report sketch
- renders the QC tolerance table
- provides print and close actions

### `src/components/BlankReportView.tsx`

The printable blank report view.

Responsibilities:

- renders blank sizing assumptions and output
- renders print-friendly cutting and thickness maps
- renders thickness zone and warning tables
- provides print and close actions

### `src/styles.css`

Global application styling for:

- layout
- cards
- form controls
- responsive behavior
- print mode
- report layout

## Runtime Flow

The application runtime is intentionally straightforward:

1. User edits form values in `App.tsx`
2. Raw string inputs are validated in `validateForm`
3. If validation succeeds, parsed config is passed to `calculateGeometry`
4. Drawing helpers prepare SVG geometry and nozzle placement
5. `PreviewPanel` renders the live engineering preview
6. `BlankModulePanel` renders blank sizing and thickness estimates when blank assumptions are valid
7. `ReportView` or `BlankReportView` renders the selected print-ready document when opened

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Build Output

The Vite build is generated in:

```text
dist/
```

For deployment, the GitHub Actions workflow converts the build output into a website-friendly bundle:

- `dist/index.html` becomes `app.html`
- `dist/assets/*` is published as `assets/*`

This allows the website repository to keep serving the utility from:

```text
static/utility-apps/pressure-vessel-dished-end-calc/app.html
```

## Deployment

The repository includes a GitHub Actions workflow in:

```text
.github/workflows/deploy.yml
```

Workflow summary:

1. checks out this repository
2. installs dependencies with `npm ci`
3. builds the application with `npm run build`
4. prepares a deploy bundle with `app.html` and `assets/`
5. pushes the built output to the website repository `cadautoscript.com`

Target deployment path in the website repository:

```text
static/utility-apps/pressure-vessel-dished-end-calc
```

## Notes For Developers

- The legacy `app.html` should be treated as the behavioral reference when changing formulas or UI flow.
- If engineering logic changes, update both the UI behavior and this documentation.
- Keep validation conservative. It is better to block impossible configurations than to produce misleading results.
- The current report flow uses the browser print dialog rather than generating a binary PDF file in code.

## Known Limitations

- Weight and volume calculations are simplified and intended for quick estimation, not code-level design verification.
- Blank sizing and forming thickness maps are engineering v1 estimates and must be confirmed with the forming supplier before manufacturing release.
- Nozzle cutouts do not reduce blank size or waste in the v1 blank module.
- Nozzle handling is visual and positional only; it does not perform reinforcement or stress calculations.
- Material density handling is simplified.
- The report is print-oriented rather than a full document export engine.
