const config = {
  requireModule: ['ts-node/register'],
  require: [
    'step-definitions/**/*.ts',
    'support/**/*.ts'
  ],
  format: [
    'progress-bar'
  ],
  features: 'features/**/*.feature',
  parallel: 1,
  retryCount: 0
};

module.exports = config;