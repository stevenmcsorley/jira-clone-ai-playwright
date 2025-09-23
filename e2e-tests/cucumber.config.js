const config = {
  require: [
    'step-definitions/**/*.ts',
    'support/**/*.ts'
  ],
  format: [
    'progress-bar',
    'json:test-results/cucumber-results.json',
    'html:test-results/cucumber-report.html'
  ],
  features: 'features/**/*.feature',
  parallel: 2,
  retryCount: 1,
  requireModule: ['ts-node/register'],
  transpileOnly: true
};

module.exports = config;