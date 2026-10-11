/**
 * Babel configuration.
 *
 * 1. `env-inline` (inline below): reads API_BASE_URL from .env.development /
 *    .env.production and inlines `env.API_BASE_URL` references at bundle time.
 *    This mirrors @react-native-dotenv's behavior with zero dependencies, so
 *    the same .env files work everywhere.
 * 2. react-native-reanimated/plugin — must be listed last.
 */
const path = require('path');
const fs = require('fs');

const ENV_NAMES = ['API_BASE_URL'];

function loadEnvFile(suffix) {
  const file = path.resolve(__dirname, `.env.${suffix}`);
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !line.trim().startsWith('#')) out[match[1]] = match[2];
  }
  return out;
}

const activeEnv =
  process.env.APP_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development');
const envValues = loadEnvFile(activeEnv);

function envInlinePlugin() {
  return {
    name: 'aarogyanetra-env-inline',
    visitor: {
      MemberExpression(p) {
        const { node } = p;
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'env' &&
          !node.computed &&
          node.property.type === 'Identifier' &&
          ENV_NAMES.includes(node.property.name) &&
          typeof envValues[node.property.name] === 'string'
        ) {
          p.replaceWithSourceString(JSON.stringify(envValues[node.property.name]));
        }
      },
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [envInlinePlugin, 'react-native-reanimated/plugin'],
};
