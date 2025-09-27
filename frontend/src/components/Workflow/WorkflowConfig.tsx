/**
 * Workflow Configuration Component
 *
 * Admin interface for configuring workflow rules and business logic.
 * This allows project administrators to customize the workflow behavior.
 */

import React, { useState } from 'react';
import { WorkflowConfig as IWorkflowConfig } from '../../machines/issue-status.machine';
import { Button } from '../ui/Button';

interface WorkflowConfigProps {
  config: IWorkflowConfig;
  onSave: (config: IWorkflowConfig) => void;
  onCancel: () => void;
}

export const WorkflowConfig: React.FC<WorkflowConfigProps> = ({
  config,
  onSave,
  onCancel,
}) => {
  const [formConfig, setFormConfig] = useState<IWorkflowConfig>(config);

  const handleSave = () => {
    onSave(formConfig);
  };

  const updateConfig = (field: keyof IWorkflowConfig, value: boolean | number) => {
    setFormConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="workflow-config bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Workflow Configuration</h2>

      <div className="space-y-6">
        {/* Start Work Requirements */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Start Work Requirements</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formConfig.requireAssigneeForStart}
              onChange={(e) => updateConfig('requireAssigneeForStart', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              Require assignee before starting work
            </span>
          </label>
        </div>

        {/* Review Requirements */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Review Requirements</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formConfig.requireDescriptionForReview}
              onChange={(e) => updateConfig('requireDescriptionForReview', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              Require description before submitting for review
            </span>
          </label>
        </div>

        {/* Completion Rules */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Completion Rules</h3>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formConfig.allowDirectCompletion}
                onChange={(e) => updateConfig('allowDirectCompletion', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">
                Allow direct completion from Todo for small tasks
              </span>
            </label>

            <div className="ml-6">
              <label className="block text-xs text-gray-500 mb-1">
                Auto-complete threshold (minutes):
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formConfig.autoCompleteThreshold}
                onChange={(e) => updateConfig('autoCompleteThreshold', parseInt(e.target.value) || 5)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formConfig.requireApprovalForCompletion}
                onChange={(e) => updateConfig('requireApprovalForCompletion', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">
                Require approval for high-priority and epic issues
              </span>
            </label>
          </div>
        </div>

        {/* Reopen Rules */}
        <div className="pb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Reopen Rules</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formConfig.allowReopenFromDone}
              onChange={(e) => updateConfig('allowReopenFromDone', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              Allow reopening completed issues
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Configuration
        </Button>
      </div>

      {/* Configuration Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Current Configuration:</h4>
        <pre className="text-xs text-gray-600 overflow-x-auto">
          {JSON.stringify(formConfig, null, 2)}
        </pre>
      </div>
    </div>
  );
};