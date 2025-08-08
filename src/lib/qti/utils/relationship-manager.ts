/**
 * @fileoverview Hierarchical Relationship Manager
 * 
 * This module provides advanced relationship management for QTI components,
 * handling parent-child relationships, dependencies, and hierarchical
 * structures within assessment packages.
 */

import {
  QTIAssessmentTest,
  QTIAssessmentSection,
  QTIAssessmentItem,
  QTIError,
  QTIErrorType,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types';

/**
 * Relationship types in QTI hierarchy
 */
export enum RelationshipType {
  PARENT_CHILD = 'parent_child',
  DEPENDENCY = 'dependency',
  SEQUENCE = 'sequence',
  REFERENCE = 'reference'
}

/**
 * QTI component reference
 */
export interface ComponentReference {
  /** Component identifier */
  id: string;
  /** Component type */
  type: 'test' | 'section' | 'item';
  /** Component title */
  title?: string;
  /** Parent component ID */
  parentId?: string;
  /** Child component IDs */
  childIds?: string[];
}

/**
 * Relationship definition
 */
export interface Relationship {
  /** Unique relationship ID */
  id: string;
  /** Relationship type */
  type: RelationshipType;
  /** Source component ID */
  sourceId: string;
  /** Target component ID */
  targetId: string;
  /** Relationship metadata */
  metadata?: {
    /** Relationship strength (0-1) */
    strength?: number;
    /** Whether relationship is required */
    required?: boolean;
    /** Custom properties */
    properties?: Record<string, any>;
  };
}

/**
 * Hierarchy validation result
 */
export interface HierarchyValidationResult extends ValidationResult {
  /** Detected circular dependencies */
  circularDependencies?: string[][];
  /** Orphaned components */
  orphanedComponents?: string[];
  /** Missing dependencies */
  missingDependencies?: string[];
  /** Relationship statistics */
  statistics?: {
    totalComponents: number;
    totalRelationships: number;
    maxDepth: number;
    averageChildrenPerParent: number;
  };
}

/**
 * Hierarchical Relationship Manager
 * 
 * Manages complex relationships between QTI components including parent-child
 * hierarchies, dependencies, and validation of structural integrity.
 */
export class RelationshipManager {
  private components = new Map<string, ComponentReference>();
  private relationships = new Map<string, Relationship>();
  private parentChildMap = new Map<string, string[]>(); // parent -> children
  private childParentMap = new Map<string, string>(); // child -> parent
  private dependencyGraph = new Map<string, string[]>(); // component -> dependencies

  constructor() {
    this.reset();
  }

  /**
   * Register a QTI component in the relationship system
   * 
   * @param component - Component to register
   * @param parentId - Optional parent component ID
   */
  registerComponent(
    id: string,
    type: 'test' | 'section' | 'item',
    title?: string,
    parentId?: string
  ): void {

    const component: ComponentReference = {
      id,
      type,
      title,
      parentId,
      childIds: []
    };

    this.components.set(id, component);

    // Handle parent-child relationships
    if (parentId) {
      this.addParentChildRelationship(parentId, id);
    }
  }

  /**
   * Add parent-child relationship
   * 
   * @param parentId - Parent component ID
   * @param childId - Child component ID
   */
  addParentChildRelationship(parentId: string, childId: string): void {
    // Update parent's children list
    if (!this.parentChildMap.has(parentId)) {
      this.parentChildMap.set(parentId, []);
    }
    const children = this.parentChildMap.get(parentId)!;
    if (!children.includes(childId)) {
      children.push(childId);
    }

    // Update child's parent
    this.childParentMap.set(childId, parentId);

    // Update component references
    const parent = this.components.get(parentId);
    if (parent) {
      if (!parent.childIds) parent.childIds = [];
      if (!parent.childIds.includes(childId)) {
        parent.childIds.push(childId);
      }
    }

    const child = this.components.get(childId);
    if (child) {
      child.parentId = parentId;
    }

    // Create relationship record
    const relationshipId = `${parentId}_parent_of_${childId}`;
    this.relationships.set(relationshipId, {
      id: relationshipId,
      type: RelationshipType.PARENT_CHILD,
      sourceId: parentId,
      targetId: childId,
      metadata: { required: true, strength: 1.0 }
    });

  }

  /**
   * Add dependency relationship
   * 
   * @param dependentId - Component that depends on another
   * @param dependencyId - Component that is depended upon
   * @param required - Whether dependency is required
   */
  addDependency(
    dependentId: string,
    dependencyId: string,
    required: boolean = true
  ): void {
    if (!this.dependencyGraph.has(dependentId)) {
      this.dependencyGraph.set(dependentId, []);
    }

    const dependencies = this.dependencyGraph.get(dependentId)!;
    if (!dependencies.includes(dependencyId)) {
      dependencies.push(dependencyId);
    }

    // Create relationship record
    const relationshipId = `${dependentId}_depends_on_${dependencyId}`;
    this.relationships.set(relationshipId, {
      id: relationshipId,
      type: RelationshipType.DEPENDENCY,
      sourceId: dependentId,
      targetId: dependencyId,
      metadata: { required, strength: required ? 1.0 : 0.5 }
    });

  }

  /**
   * Remove a relationship
   * 
   * @param relationshipId - ID of relationship to remove
   */
  removeRelationship(relationshipId: string): boolean {
    const relationship = this.relationships.get(relationshipId);
    if (!relationship) {
      return false;
    }

    const { type, sourceId, targetId } = relationship;

    switch (type) {
      case RelationshipType.PARENT_CHILD:
        this.removeParentChildRelationship(sourceId, targetId);
        break;
      
      case RelationshipType.DEPENDENCY:
        this.removeDependencyRelationship(sourceId, targetId);
        break;
    }

    this.relationships.delete(relationshipId);
    return true;
  }

  /**
   * Remove parent-child relationship
   */
  private removeParentChildRelationship(parentId: string, childId: string): void {
    // Remove from parent's children list
    const children = this.parentChildMap.get(parentId);
    if (children) {
      const index = children.indexOf(childId);
      if (index > -1) {
        children.splice(index, 1);
      }
    }

    // Remove child's parent
    this.childParentMap.delete(childId);

    // Update component references
    const parent = this.components.get(parentId);
    if (parent && parent.childIds) {
      const index = parent.childIds.indexOf(childId);
      if (index > -1) {
        parent.childIds.splice(index, 1);
      }
    }

    const child = this.components.get(childId);
    if (child) {
      child.parentId = undefined;
    }
  }

  /**
   * Remove dependency relationship
   */
  private removeDependencyRelationship(dependentId: string, dependencyId: string): void {
    const dependencies = this.dependencyGraph.get(dependentId);
    if (dependencies) {
      const index = dependencies.indexOf(dependencyId);
      if (index > -1) {
        dependencies.splice(index, 1);
      }
    }
  }

  /**
   * Get children of a component
   * 
   * @param componentId - Parent component ID
   * @returns Array of child component IDs
   */
  getChildren(componentId: string): string[] {
    return this.parentChildMap.get(componentId) || [];
  }

  /**
   * Get parent of a component
   * 
   * @param componentId - Child component ID
   * @returns Parent component ID or undefined
   */
  getParent(componentId: string): string | undefined {
    return this.childParentMap.get(componentId);
  }

  /**
   * Get dependencies of a component
   * 
   * @param componentId - Component ID
   * @returns Array of dependency component IDs
   */
  getDependencies(componentId: string): string[] {
    return this.dependencyGraph.get(componentId) || [];
  }

  /**
   * Get all ancestors of a component
   * 
   * @param componentId - Component ID
   * @returns Array of ancestor component IDs (from immediate parent to root)
   */
  getAncestors(componentId: string): string[] {
    const ancestors: string[] = [];
    let currentId = componentId;

    while (true) {
      const parentId = this.getParent(currentId);
      if (!parentId) break;
      
      ancestors.push(parentId);
      currentId = parentId;
    }

    return ancestors;
  }

  /**
   * Get all descendants of a component
   * 
   * @param componentId - Component ID
   * @returns Array of descendant component IDs
   */
  getDescendants(componentId: string): string[] {
    const descendants: string[] = [];
    const children = this.getChildren(componentId);

    for (const childId of children) {
      descendants.push(childId);
      descendants.push(...this.getDescendants(childId)); // Recursive
    }

    return descendants;
  }

  /**
   * Get the depth of a component in the hierarchy
   * 
   * @param componentId - Component ID
   * @returns Depth level (0 for root components)
   */
  getDepth(componentId: string): number {
    return this.getAncestors(componentId).length;
  }

  /**
   * Get the root component for a given component
   * 
   * @param componentId - Component ID
   * @returns Root component ID
   */
  getRoot(componentId: string): string {
    const ancestors = this.getAncestors(componentId);
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : componentId;
  }

  /**
   * Check if one component is an ancestor of another
   * 
   * @param ancestorId - Potential ancestor ID
   * @param descendantId - Potential descendant ID
   * @returns True if ancestor relationship exists
   */
  isAncestor(ancestorId: string, descendantId: string): boolean {
    return this.getAncestors(descendantId).includes(ancestorId);
  }

  /**
   * Check if one component is a descendant of another
   * 
   * @param descendantId - Potential descendant ID
   * @param ancestorId - Potential ancestor ID
   * @returns True if descendant relationship exists
   */
  isDescendant(descendantId: string, ancestorId: string): boolean {
    return this.getDescendants(ancestorId).includes(descendantId);
  }

  /**
   * Validate the entire hierarchy for structural integrity
   * 
   * @returns Validation result with detailed analysis
   */
  validateHierarchy(): HierarchyValidationResult {

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for circular dependencies
    const circularDependencies = this.detectCircularDependencies();
    if (circularDependencies.length > 0) {
      circularDependencies.forEach(cycle => {
        errors.push({
          code: 'CIRCULAR_DEPENDENCY',
          message: `Circular dependency detected: ${cycle.join(' -> ')}`,
          severity: 'error'
        });
      });
    }

    // Check for orphaned components
    const orphanedComponents = this.findOrphanedComponents();
    if (orphanedComponents.length > 0) {
      orphanedComponents.forEach(componentId => {
        warnings.push({
          code: 'ORPHANED_COMPONENT',
          message: `Component ${componentId} has no parent or children`,
          location: componentId
        });
      });
    }

    // Check for missing dependencies
    const missingDependencies = this.findMissingDependencies();
    if (missingDependencies.length > 0) {
      missingDependencies.forEach(depId => {
        errors.push({
          code: 'MISSING_DEPENDENCY',
          message: `Referenced dependency ${depId} does not exist`,
          severity: 'error'
        });
      });
    }

    // Check for invalid parent-child relationships
    this.validateParentChildRelationships(errors, warnings);

    // Calculate statistics
    const statistics = this.calculateHierarchyStatistics();

    const result: HierarchyValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      circularDependencies,
      orphanedComponents,
      missingDependencies,
      statistics,
      summary: errors.length === 0
        ? `Hierarchy validation passed with ${warnings.length} warning(s)`
        : `Hierarchy validation failed with ${errors.length} error(s) and ${warnings.length} warning(s)`
    };

    return result;
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (componentId: string): void => {
      if (recursionStack.has(componentId)) {
        // Found a cycle
        const cycleStart = path.indexOf(componentId);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), componentId]);
        }
        return;
      }

      if (visited.has(componentId)) {
        return;
      }

      visited.add(componentId);
      recursionStack.add(componentId);
      path.push(componentId);

      const dependencies = this.getDependencies(componentId);
      for (const depId of dependencies) {
        dfs(depId);
      }

      recursionStack.delete(componentId);
      path.pop();
    };

    // Check all components
    for (const componentId of this.components.keys()) {
      if (!visited.has(componentId)) {
        dfs(componentId);
      }
    }

    return cycles;
  }

  /**
   * Find components with no relationships
   */
  private findOrphanedComponents(): string[] {
    const orphaned: string[] = [];

    for (const [componentId] of this.components) {
      const hasParent = this.getParent(componentId) !== undefined;
      const hasChildren = this.getChildren(componentId).length > 0;
      const hasDependencies = this.getDependencies(componentId).length > 0;
      const isDependedOn = this.isComponentDependedOn(componentId);

      if (!hasParent && !hasChildren && !hasDependencies && !isDependedOn) {
        orphaned.push(componentId);
      }
    }

    return orphaned;
  }

  /**
   * Check if a component is depended on by others
   */
  private isComponentDependedOn(componentId: string): boolean {
    for (const [, dependencies] of this.dependencyGraph) {
      if (dependencies.includes(componentId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find missing dependency references
   */
  private findMissingDependencies(): string[] {
    const missing: string[] = [];

    for (const [, dependencies] of this.dependencyGraph) {
      for (const depId of dependencies) {
        if (!this.components.has(depId)) {
          missing.push(depId);
        }
      }
    }

    return [...new Set(missing)]; // Remove duplicates
  }

  /**
   * Validate parent-child relationships
   */
  private validateParentChildRelationships(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [parentId, children] of this.parentChildMap) {
      // Check if parent exists
      if (!this.components.has(parentId)) {
        errors.push({
          code: 'MISSING_PARENT',
          message: `Parent component ${parentId} does not exist`,
          severity: 'error'
        });
        continue;
      }

      const parent = this.components.get(parentId)!;

      // Validate parent-child type relationships
      for (const childId of children) {
        if (!this.components.has(childId)) {
          errors.push({
            code: 'MISSING_CHILD',
            message: `Child component ${childId} does not exist`,
            severity: 'error'
          });
          continue;
        }

        const child = this.components.get(childId)!;

        // Validate type hierarchy (test -> section -> item)
        if (!this.isValidParentChildType(parent.type, child.type)) {
          errors.push({
            code: 'INVALID_HIERARCHY',
            message: `Invalid parent-child relationship: ${parent.type} cannot contain ${child.type}`,
            severity: 'error',
            location: `${parentId} -> ${childId}`
          });
        }
      }
    }
  }

  /**
   * Check if parent-child type relationship is valid
   */
  private isValidParentChildType(parentType: string, childType: string): boolean {
    const validRelationships = {
      'test': ['section'],
      'section': ['item'],
      'item': [] // Items cannot have children in standard QTI
    };

    const allowedChildren = validRelationships[parentType] || [];
    return allowedChildren.includes(childType);
  }

  /**
   * Calculate hierarchy statistics
   */
  private calculateHierarchyStatistics() {
    const totalComponents = this.components.size;
    const totalRelationships = this.relationships.size;

    // Calculate max depth
    let maxDepth = 0;
    for (const componentId of this.components.keys()) {
      const depth = this.getDepth(componentId);
      maxDepth = Math.max(maxDepth, depth);
    }

    // Calculate average children per parent
    const parentsWithChildren = Array.from(this.parentChildMap.entries())
      .filter(([, children]) => children.length > 0);
    
    const totalChildren = parentsWithChildren.reduce(
      (sum, [, children]) => sum + children.length,
      0
    );
    
    const averageChildrenPerParent = parentsWithChildren.length > 0
      ? totalChildren / parentsWithChildren.length
      : 0;

    return {
      totalComponents,
      totalRelationships,
      maxDepth,
      averageChildrenPerParent: Math.round(averageChildrenPerParent * 100) / 100
    };
  }

  /**
   * Get all components of a specific type
   * 
   * @param type - Component type to filter by
   * @returns Array of component references
   */
  getComponentsByType(type: 'test' | 'section' | 'item'): ComponentReference[] {
    return Array.from(this.components.values()).filter(comp => comp.type === type);
  }

  /**
   * Get component reference by ID
   * 
   * @param componentId - Component ID
   * @returns Component reference or undefined
   */
  getComponent(componentId: string): ComponentReference | undefined {
    return this.components.get(componentId);
  }

  /**
   * Get all relationships
   * 
   * @returns Array of all relationships
   */
  getAllRelationships(): Relationship[] {
    return Array.from(this.relationships.values());
  }

  /**
   * Get relationships by type
   * 
   * @param type - Relationship type to filter by
   * @returns Array of relationships of the specified type
   */
  getRelationshipsByType(type: RelationshipType): Relationship[] {
    return Array.from(this.relationships.values()).filter(rel => rel.type === type);
  }

  /**
   * Export hierarchy as a tree structure
   * 
   * @returns Hierarchical tree representation
   */
  exportHierarchy(): any {
    const roots = Array.from(this.components.values())
      .filter(comp => !comp.parentId);

    const buildTree = (component: ComponentReference): any => {
      const children = this.getChildren(component.id)
        .map(childId => this.components.get(childId))
        .filter(child => child !== undefined)
        .map(child => buildTree(child!));

      return {
        id: component.id,
        type: component.type,
        title: component.title,
        children: children.length > 0 ? children : undefined,
        dependencies: this.getDependencies(component.id)
      };
    };

    return roots.map(root => buildTree(root));
  }

  /**
   * Import hierarchy from tree structure
   * 
   * @param trees - Array of tree structures
   */
  importHierarchy(trees: any[]): void {
    this.reset();

    const processTree = (tree: any, parentId?: string): void => {
      this.registerComponent(tree.id, tree.type, tree.title, parentId);

      // Process dependencies
      if (tree.dependencies && Array.isArray(tree.dependencies)) {
        for (const depId of tree.dependencies) {
          this.addDependency(tree.id, depId);
        }
      }

      // Process children
      if (tree.children && Array.isArray(tree.children)) {
        for (const child of tree.children) {
          processTree(child, tree.id);
        }
      }
    };

    for (const tree of trees) {
      processTree(tree);
    }
  }

  /**
   * Get relationship statistics
   */
  getStats() {
    return {
      components: this.components.size,
      relationships: this.relationships.size,
      parentChildRelationships: this.parentChildMap.size,
      dependencyRelationships: this.dependencyGraph.size
    };
  }

  /**
   * Reset all relationships and components
   */
  reset(): void {
    this.components.clear();
    this.relationships.clear();
    this.parentChildMap.clear();
    this.childParentMap.clear();
    this.dependencyGraph.clear();
  }
}

/**
 * Default relationship manager instance
 */
export const defaultRelationshipManager = new RelationshipManager();