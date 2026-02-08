// MaterialCalculator.jsx
// This file is now a re-export proxy for backward compatibility.
// The actual implementation has been split into modular files under ./material-calculator/
//
// Structure:
//   material-calculator/
//     constants.js          - All data constants, reference tables, utility functions
//     components/shared.jsx - Reusable UI components (InputField, SelectField, etc.)
//     calculators/
//       ComponentCalculator.jsx    - Structural component calculator (columns, beams, slabs, etc.)
//       StructureCalculator.jsx    - Concrete & rebar bulk calculator
//       MasonryCalculator.jsx      - Brick, cement, sand calculator
//       TileCalculator.jsx         - Tile & grout calculator
//       FinishCalculator.jsx       - Paint calculator
//       BuildingEstimator.jsx      - Quick building estimate
//       ScaffoldingCalculator.jsx  - Scaffolding calculator
//       WaterproofCalculator.jsx   - Waterproof & insulation calculator
//     index.jsx             - Main page with tab navigation and BOM export

export { MaterialCalculator } from './material-calculator/index';
export { MaterialCalculator as default } from './material-calculator/index';
