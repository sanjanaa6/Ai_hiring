const { ESLint } = require("eslint");

(async function main() {
  // Create ESLint instance with autofix enabled
  const eslint = new ESLint({
    fix: true, // enable auto-fix
    overrideConfig: {
      plugins: ["unused-imports"],
      rules: {
        "no-unused-vars": "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
          "warn",
          {
            vars: "all",
            varsIgnorePattern: "^_",
            args: "after-used",
            argsIgnorePattern: "^_"
          }
        ]
      }
    },
    useEslintrc: true, // keep your existing ESLint config if present
  });

  // Lint all files in src
  const results = await eslint.lintFiles(["src/**/*.{js,jsx}"]);

  // Apply fixes
  await ESLint.outputFixes(results);

  // Show what was fixed
  results.forEach((result) => {
    if (result.messages.length > 0) {
      console.log(`\n🔍 Checked: ${result.filePath}`);
      result.messages.forEach((msg) => {
        console.log(`  ${msg.line}:${msg.column} ${msg.ruleId} → ${msg.message}`);
      });
    }
  });

  console.log("\n✅ Cleanup complete! Unused imports removed.");
})();
