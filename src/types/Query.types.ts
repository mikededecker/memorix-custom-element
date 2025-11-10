/**
 * Defines the supported comparison operators.
 */
type Operator =
    | 'equals'
    | 'notEmpty'
    | 'ne'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'in'
    | 'nin'
    | 'contains'
    | 'startsWith'
    | 'endsWith';

/**
 * A type representing the value a field is being compared against.
 * This can be any primitive type or an array of primitives for 'in'/'nin' operators.
 */
type ConditionValue = string | number | boolean | Date | (string | number | Date)[];

/**
 * Represents a single field-based condition (e.g., age > 30).
 * @param type Discriminator for the union.
 * @param field The name of the field to query.
 * @param operator The comparison operator (e.g., 'eq', 'gt').
 * @param value The value to compare against.
 */
interface FieldQuery {
    type: 'FieldQuery';
    field: string;
    operator: Operator;
    value: ConditionValue;
}

interface FullTextQuery {
    type: 'FullTextQuery';
    query: string;
}

/**
 * The base type for a logical query, which must contain an array of sub-queries.
 */
interface BaseLogicalQuery {
    queries: AbstractQuery[];
}

/**
 * Represents an 'AND' logical combination of multiple sub-queries.
 * @param type Discriminator for the union.
 * @param queries An array of AbstractQuery items, all of which must be true.
 */
interface AndQuery extends BaseLogicalQuery {
    type: 'AndQuery';
}

/**
 * Represents an 'OR' logical combination of multiple sub-queries.
 * @param type Discriminator for the union.
 * @param queries An array of AbstractQuery items, one of which must be true.
 */
interface OrQuery extends BaseLogicalQuery {
    type: 'OrQuery';
}

/**
 * The main AbstractQuery type, which is a discriminated union of all possible query parts.
 */
export type AbstractQuery = FieldQuery | AndQuery | OrQuery | FullTextQuery;


export interface Facet { count: number, value: string }