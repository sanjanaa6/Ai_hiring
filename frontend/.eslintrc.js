module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Make unused variables warnings instead of errors
    'no-unused-vars': 'off',
    // Relax React hooks rules
    'react-hooks/exhaustive-deps': 'off',
    // Allow console statements
    'no-console': 'off',
    // Allow new Function constructor
    'no-new-func': 'off',
    // Disable import rules that cause issues
    'import/no-anonymous-default-export': 'off'
  },
  overrides: [
    {
      files: ['src/pcb/**/*.jsx', 'src/pcb/**/*.js'],
      rules: {
        // More relaxed rules for PCB components
        'no-unused-vars': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-new-func': 'off'
      }
    }
  ]
};
