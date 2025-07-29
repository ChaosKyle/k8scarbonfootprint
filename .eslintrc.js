module.exports = {
  extends: ['@grafana/eslint-config'],
  root: true,
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Code quality rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    
    // React rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off', // Using TypeScript for prop validation
    
    // Performance rules
    'react/jsx-no-constructed-context-values': 'warn',
    'react/no-array-index-key': 'warn',
    
    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    
    // Carbon efficiency rules (custom)
    'no-console': 'warn', // Reduce logging overhead in production
    'prefer-const': 'error', // Better optimization
    'no-var': 'error', // Use more efficient variable declarations
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};