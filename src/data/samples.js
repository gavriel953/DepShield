/**
 * DepShield — Sample Dependency Files
 * Intentionally crafted samples with various supply chain risks for demonstration
 */

export const SAMPLES = {
  npm: `{
  "name": "my-web-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "loadsh": "^4.17.21",
    "axois": "^1.6.0",
    "lod-ash": "^4.17.0",
    "internal-auth-service": "^2.1.0",
    "private-payment-sdk": "^1.0.5",
    "corp-analytics": "^3.2.1",
    "uuid": "^9.0.0",
    "cors": "^2.8.5",
    "mongose": "^7.0.0",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jst": "^29.7.0",
    "chaulk": "^5.0.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0",
    "test-utils-deprecated": "^0.0.3"
  }
}`,

  pip: `# My ML Project Dependencies
flask==2.3.3
numpy==1.24.0
pandass==2.1.0
reqeusts==2.31.0
scikit-learn>=1.3.0
tensorflow>=2.13.0
matplotlibs==3.8.0
internal-ml-pipeline>=1.0
private-data-loader>=0.5.2
corp-model-registry>=2.0
beautifulsoup4==4.12.2
python-dateutil>=2.8.0
pyyaml>=6.0
redis>=4.0
celery>=5.3
flaask>=3.0.0
djang>=4.0
pillow>=10.0
python-openssl>=23.0.0
ab>=0.0.1`,

  gem: `source 'https://rubygems.org'

gem 'rails', '~> 7.0'
gem 'pg', '~> 1.5'
gem 'puma', '~> 6.0'
gem 'nokogiris', '~> 1.15'
gem 'sinatras', '~> 3.0'
gem 'devise', '~> 4.9'
gem 'internal-sso-client', '~> 2.0'
gem 'corp-billing-sdk', '~> 1.5'
gem 'private-audit-logger', '~> 3.1'
gem 'sidekiq', '~> 7.0'
gem 'redis', '~> 5.0'
gem 'rspec', '~> 3.12'
gem 'factory_bot', '~> 6.2'
gem 'raills', '~> 7.0'
gem 'test-helper-abandoned', '0.0.1'
gem 'x', '>= 0'

group :development do
  gem 'rubocop', '~> 1.50'
  gem 'pry', '~> 0.14'
end`,
};
