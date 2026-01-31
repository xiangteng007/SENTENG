// Core Module Exports
export { CoreModule } from './core.module';

// Base
export { BaseEntity } from './base/base.entity';

// ID Generator
export { IdGeneratorService } from './id-generator/id-generator.service';

// Ownership
export { OwnershipGuard, checkResourceOwnership, OWNERSHIP_KEY } from './ownership/ownership.guard';

// Errors (Phase 3)
export * from './errors';

// Feature Toggle (Phase 3)
export { FeatureToggleService } from './services/feature-toggle.service';
