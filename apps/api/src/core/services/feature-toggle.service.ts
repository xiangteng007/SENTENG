import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  enabledForUsers?: string[];
  enabledForRoles?: string[];
}

/**
 * Feature Toggle Service
 * Enables/disables features dynamically for A/B testing and gradual rollouts
 * Phase 3 optimization - Production readiness
 */
@Injectable()
export class FeatureToggleService {
  private readonly logger = new Logger(FeatureToggleService.name);
  private readonly features: Map<string, FeatureFlag> = new Map();

  // Default feature flags
  private readonly defaultFlags: FeatureFlag[] = [
    {
      name: 'ENHANCED_AUDIT_LOGGING',
      enabled: true,
      description: 'Enable enhanced security audit logging',
    },
    {
      name: 'AI_SUGGESTIONS',
      enabled: false,
      description: 'Enable AI-powered suggestions for quotes and costs',
    },
    {
      name: 'REAL_TIME_SYNC',
      enabled: true,
      description: 'Enable WebSocket real-time data synchronization',
    },
    {
      name: 'ADVANCED_PROCUREMENT',
      enabled: true,
      description: 'Enable advanced procurement with bid comparison',
    },
    {
      name: 'VENDOR_RATING_V2',
      enabled: true,
      description: 'Enable new vendor rating system with detailed metrics',
    },
    {
      name: 'INVOICE_BATCH_UPLOAD',
      enabled: false,
      description: 'Enable batch upload for Taiwan e-invoices',
    },
    {
      name: 'MOBILE_PUSH_NOTIFICATIONS',
      enabled: false,
      description: 'Enable push notifications for mobile app',
    },
    {
      name: 'DARK_MODE',
      enabled: true,
      description: 'Enable dark mode theme support',
    },
  ];

  constructor(private readonly configService: ConfigService) {
    this.initializeFeatures();
  }

  private initializeFeatures(): void {
    // Load default features
    this.defaultFlags.forEach((flag) => {
      this.features.set(flag.name, flag);
    });

    // Override from environment variables
    this.features.forEach((flag, name) => {
      const envValue = this.configService.get<string>(`FEATURE_${name}`);
      if (envValue !== undefined) {
        flag.enabled = envValue.toLowerCase() === 'true';
        this.logger.log(`Feature ${name} set to ${flag.enabled} from environment`);
      }
    });

    this.logger.log(`Initialized ${this.features.size} feature flags`);
  }

  isEnabled(featureName: string, context?: { userId?: string; role?: string }): boolean {
    const feature = this.features.get(featureName);
    
    if (!feature) {
      this.logger.warn(`Unknown feature flag: ${featureName}`);
      return false;
    }

    // Check global enabled/disabled
    if (!feature.enabled) {
      return false;
    }

    // Check user-specific enablement
    if (context?.userId && feature.enabledForUsers?.length) {
      if (!feature.enabledForUsers.includes(context.userId)) {
        return false;
      }
    }

    // Check role-specific enablement
    if (context?.role && feature.enabledForRoles?.length) {
      if (!feature.enabledForRoles.includes(context.role)) {
        return false;
      }
    }

    // Check rollout percentage
    if (feature.rolloutPercentage !== undefined && feature.rolloutPercentage < 100) {
      const hash = this.hashUserId(context?.userId || 'anonymous');
      if (hash > feature.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  getAllFeatures(): FeatureFlag[] {
    return Array.from(this.features.values());
  }

  setFeature(name: string, enabled: boolean): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.enabled = enabled;
      this.logger.log(`Feature ${name} set to ${enabled}`);
    } else {
      this.features.set(name, { name, enabled });
      this.logger.log(`Feature ${name} created and set to ${enabled}`);
    }
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }
}
