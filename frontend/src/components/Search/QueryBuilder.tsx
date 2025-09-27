/**
 * Visual Query Builder Component
 *
 * Drag-and-drop interface for building JQL queries without
 * requiring knowledge of JQL syntax.
 */

import React, { useState } from 'react';
import type { SearchQuery } from '../../machines/search.machine';

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
  connector: 'AND' | 'OR';
}

interface QueryBuilderProps {
  onQueryChange: (query: SearchQuery) => void;
  className?: string;
}

const FIELD_OPTIONS = [
  { value: 'project', label: 'Project', type: 'select' },
  { value: 'assignee', label: 'Assignee', type: 'user' },
  { value: 'status', label: 'Status', type: 'select' },
  { value: 'priority', label: 'Priority', type: 'select' },
  { value: 'type', label: 'Issue Type', type: 'select' },
  { value: 'labels', label: 'Labels', type: 'multiselect' },
  { value: 'created', label: 'Created', type: 'date' },
  { value: 'updated', label: 'Updated', type: 'date' },
  { value: 'due', label: 'Due Date', type: 'date' },
  { value: 'title', label: 'Summary', type: 'text' },
  { value: 'description', label: 'Description', type: 'text' },
];

const OPERATOR_OPTIONS = {
  text: [
    { value: '~', label: 'contains' },
    { value: '!~', label: 'does not contain' },
    { value: '=', label: 'equals' },
    { value: '!=', label: 'does not equal' },
  ],
  select: [
    { value: '=', label: 'equals' },
    { value: '!=', label: 'does not equal' },
    { value: 'IN', label: 'is one of' },
    { value: 'NOT IN', label: 'is not one of' },
  ],
  multiselect: [
    { value: 'IN', label: 'includes' },
    { value: 'NOT IN', label: 'excludes' },
  ],
  user: [
    { value: '=', label: 'is' },
    { value: '!=', label: 'is not' },
    { value: 'IS EMPTY', label: 'is unassigned' },
    { value: 'IS NOT EMPTY', label: 'is assigned' },
  ],
  date: [
    { value: '>', label: 'after' },
    { value: '<', label: 'before' },
    { value: '>=', label: 'on or after' },
    { value: '<=', label: 'on or before' },
    { value: '=', label: 'on' },
  ],
};

const VALUE_OPTIONS = {
  project: ['JCD', 'DEMO', 'TEST'],
  assignee: ['john', 'jane', 'mike', 'sarah'],
  status: ['todo', 'in_progress', 'code_review', 'done'],
  priority: ['low', 'medium', 'high', 'urgent'],
  type: ['story', 'task', 'bug', 'epic'],
  labels: ['frontend', 'backend', 'urgent', 'blocked', 'ready'],
};

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onQueryChange,
  className = '',
}) => {
  const [conditions, setConditions] = useState<QueryCondition[]>([
    {
      id: '1',
      field: 'project',
      operator: '=',
      value: '',
      connector: 'AND',
    },
  ]);

  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: Date.now().toString(),
      field: 'status',
      operator: '=',
      value: '',
      connector: 'AND',
    };
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    updateQuery(updatedConditions);
  };

  const removeCondition = (id: string) => {
    const updatedConditions = conditions.filter(c => c.id !== id);
    setConditions(updatedConditions);
    updateQuery(updatedConditions);
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    const updatedConditions = conditions.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    setConditions(updatedConditions);
    updateQuery(updatedConditions);
  };

  const updateQuery = (conditions: QueryCondition[]) => {
    const validConditions = conditions.filter(c => c.field && c.operator && c.value);

    if (validConditions.length === 0) {
      onQueryChange({ jql: '', filters: {} });
      return;
    }

    // Build JQL string
    const jqlParts = validConditions.map((condition, index) => {
      let valueStr = '';

      if (Array.isArray(condition.value)) {
        valueStr = `(${condition.value.map(v => `"${v}"`).join(', ')})`;
      } else if (condition.operator === 'IS EMPTY' || condition.operator === 'IS NOT EMPTY') {
        valueStr = '';
      } else {
        valueStr = `"${condition.value}"`;
      }

      const conditionStr = condition.operator === 'IS EMPTY' || condition.operator === 'IS NOT EMPTY'
        ? `${condition.field} ${condition.operator}`
        : `${condition.field} ${condition.operator} ${valueStr}`;

      return index === 0 ? conditionStr : `${condition.connector} ${conditionStr}`;
    });

    const jql = jqlParts.join(' ');

    // Build filters object
    const filters: SearchQuery['filters'] = {};
    validConditions.forEach(condition => {
      if (condition.field === 'project') {
        filters.project = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      } else if (condition.field === 'assignee') {
        filters.assignee = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      } else if (condition.field === 'status') {
        filters.status = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      } else if (condition.field === 'priority') {
        filters.priority = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      } else if (condition.field === 'type') {
        filters.type = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      } else if (condition.field === 'labels') {
        filters.labels = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      }
    });

    onQueryChange({ jql, filters });
  };

  const getFieldType = (field: string): string => {
    const fieldOption = FIELD_OPTIONS.find(f => f.value === field);
    return fieldOption?.type || 'text';
  };

  const getOperatorOptions = (field: string) => {
    const fieldType = getFieldType(field);
    return OPERATOR_OPTIONS[fieldType as keyof typeof OPERATOR_OPTIONS] || OPERATOR_OPTIONS.text;
  };

  const getValueOptions = (field: string): string[] => {
    return VALUE_OPTIONS[field as keyof typeof VALUE_OPTIONS] || [];
  };

  const renderValueInput = (condition: QueryCondition) => {
    const fieldType = getFieldType(condition.field);
    const valueOptions = getValueOptions(condition.field);

    if (condition.operator === 'IS EMPTY' || condition.operator === 'IS NOT EMPTY') {
      return (
        <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-500">
          No value required
        </div>
      );
    }

    if (fieldType === 'date') {
      return (
        <input
          type="date"
          value={condition.value as string}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (fieldType === 'multiselect' || (fieldType === 'select' && (condition.operator === 'IN' || condition.operator === 'NOT IN'))) {
      return (
        <select
          multiple
          value={Array.isArray(condition.value) ? condition.value : []}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
            updateCondition(condition.id, { value: values });
          }}
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px]"
        >
          {valueOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (valueOptions.length > 0) {
      return (
        <select
          value={condition.value as string}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select {condition.field}</option>
          {valueOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={condition.value as string}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        placeholder={`Enter ${condition.field}`}
        className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Query Builder</h3>
        <button
          onClick={addCondition}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add condition
        </button>
      </div>

      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            {/* Connector */}
            {index > 0 && (
              <select
                value={condition.connector}
                onChange={(e) => updateCondition(condition.id, { connector: e.target.value as 'AND' | 'OR' })}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}

            {/* Field */}
            <select
              value={condition.field}
              onChange={(e) => updateCondition(condition.id, { field: e.target.value, value: '' })}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FIELD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Operator */}
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(condition.id, { operator: e.target.value, value: '' })}
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getOperatorOptions(condition.field).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Value */}
            <div className="flex-1">
              {renderValueInput(condition)}
            </div>

            {/* Remove */}
            {conditions.length > 1 && (
              <button
                onClick={() => removeCondition(condition.id)}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="p-3 bg-gray-100 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-1">Generated JQL:</div>
        <code className="text-sm text-gray-600">
          {conditions.length > 0 && conditions.some(c => c.value)
            ? conditions
                .filter(c => c.field && c.operator && c.value)
                .map((c, i) => {
                  const valueStr = Array.isArray(c.value)
                    ? `(${c.value.join(', ')})`
                    : c.operator === 'IS EMPTY' || c.operator === 'IS NOT EMPTY'
                    ? ''
                    : c.value;
                  const conditionStr = c.operator === 'IS EMPTY' || c.operator === 'IS NOT EMPTY'
                    ? `${c.field} ${c.operator}`
                    : `${c.field} ${c.operator} ${valueStr}`;
                  return i === 0 ? conditionStr : `${c.connector} ${conditionStr}`;
                })
                .join(' ')
            : 'No conditions defined'
          }
        </code>
      </div>
    </div>
  );
};