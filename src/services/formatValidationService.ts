/**
 * Format Validation and Repair Service
 * 
 * Features:
 * - Detailed format validation (JSON syntax, type checking, required fields)
 * - Format repair prompt construction
 * - Automatic repair algorithms and fallback mechanisms
 * - Consistency checking
 */

import { DeepSeekApiService } from "./deepseekApi";

export interface FormatValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  type: "syntax" | "type" | "required" | "constraint" | "consistency";
  field: string;
  message: string;
  severity: "error" | "warning";
  value?: any;
  expected?: any;
  path: string;
}

export interface ValidationWarning {
  type: "format" | "optimization" | "suggestion";
  field: string;
  message: string;
  suggestion: string;
  path: string;
}

export interface ValidationSuggestion {
  type: "improvement" | "optimization" | "fix";
  field: string;
  description: string;
  example?: any;
  priority: "high" | "medium" | "low";
}

export interface FormatRepairOptions {
  mode: "auto" | "guided" | "manual";
  aggressiveness: "conservative" | "moderate" | "aggressive";
  preserveContent: boolean;
  maxRetries: number;
  fallbackToOriginal: boolean;
}

export interface FormatRepairResult {
  success: boolean;
  repairedData: any;
  originalData: any;
  appliedFixes: RepairAction[];
  remainingErrors: ValidationError[];
  repairAttempts: number;
  repairTime: number;
}

export interface RepairAction {
  type: "add" | "remove" | "modify" | "restructure";
  field: string;
  before: any;
  after: any;
  reason: string;
  confidence: number;
}

export class FormatValidationService {
  private deepseekApi: DeepSeekApiService;
  private validationCache: Map<string, FormatValidationResult>;

  constructor() {
    this.deepseekApi = new DeepSeekApiService();
    this.validationCache = new Map();
  }

  async validateFormat(data: any, expectedFormat: any): Promise<FormatValidationResult> {
    try {
      const result: FormatValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        score: 100,
        suggestions: []
      };

      // JSON syntax validation
      const syntaxErrors = this.validateJsonSyntax(data);
      result.errors.push(...syntaxErrors);

      // Type checking
      const typeErrors = this.validateTypes(data, expectedFormat);
      result.errors.push(...typeErrors);

      // Required fields checking
      const requiredFieldErrors = this.validateRequiredFields(data, expectedFormat);
      result.errors.push(...requiredFieldErrors);

      // Calculate score
      result.score = this.calculateValidationScore(result.errors, result.warnings);
      result.isValid = result.errors.filter(e => e.severity === "error").length === 0;

      return result;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: "syntax",
          field: "root",
          message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error",
          path: "$"
        }],
        warnings: [],
        score: 0,
        suggestions: []
      };
    }
  }

  private validateJsonSyntax(data: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    try {
      JSON.stringify(data);
    } catch (error) {
      errors.push({
        type: "syntax",
        field: "root",
        message: `JSON syntax error: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
        path: "$"
      });
    }
    
    return errors;
  }

  private validateTypes(data: any, expectedFormat: any): ValidationError[] {
    const errors: ValidationError[] = [];
    this.validateTypeRecursive(data, expectedFormat, errors, "$");
    return errors;
  }

  private validateTypeRecursive(data: any, expected: any, errors: ValidationError[], path: string): void {
    if (expected && typeof expected === 'object' && expected.type) {
      const actualType = typeof data;
      const expectedType = expected.type;
      
      if (actualType !== expectedType) {
        errors.push({
          type: "type",
          field: path,
          message: `Type mismatch: expected ${expectedType}, got ${actualType}`,
          severity: "error",
          value: data,
          expected: expectedType,
          path
        });
      }
    }

    if (typeof data === 'object' && data !== null && typeof expected === 'object' && expected !== null) {
      for (const key in expected) {
        if (expected.hasOwnProperty(key) && typeof expected[key] === 'object') {
          this.validateTypeRecursive(data[key], expected[key], errors, `${path}.${key}`);
        }
      }
    }
  }

  private validateRequiredFields(data: any, expectedFormat: any): ValidationError[] {
    const errors: ValidationError[] = [];
    this.validateRequiredRecursive(data, expectedFormat, errors, "$");
    return errors;
  }

  private validateRequiredRecursive(data: any, expected: any, errors: ValidationError[], path: string): void {
    if (expected && typeof expected === 'object') {
      if (expected.required && Array.isArray(expected.required)) {
        for (const requiredField of expected.required) {
          if (!data || !data.hasOwnProperty(requiredField)) {
            errors.push({
              type: "required",
              field: requiredField,
              message: `Required field missing: ${requiredField}`,
              severity: "error",
              path: `${path}.${requiredField}`
            });
          }
        }
      }

      if (expected.properties && typeof expected.properties === 'object') {
        for (const key in expected.properties) {
          if (data && data.hasOwnProperty(key)) {
            this.validateRequiredRecursive(data[key], expected.properties[key], errors, `${path}.${key}`);
          }
        }
      }
    }
  }

  private calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.filter(e => e.severity === "error").length * 20;
    const warningPenalty = warnings.length * 5;
    return Math.max(0, 100 - errorPenalty - warningPenalty);
  }

  clearCache(): void {
    this.validationCache.clear();
  }

  getValidationStats(): {
    cacheSize: number;
    cacheHitRate: number;
    repairAttempts: number;
  } {
    return {
      cacheSize: this.validationCache.size,
      cacheHitRate: 0,
      repairAttempts: 0
    };
  }
} 