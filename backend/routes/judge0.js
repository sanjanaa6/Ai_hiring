const express = require('express');
const router = express.Router();
const Judge0Service = require('../services/judge0Service');

const judge0Service = new Judge0Service();

// Get supported languages
router.get('/languages', async (req, res) => {
  try {
    console.log('🌐 [JUDGE0] Getting supported languages...');
    
    const languages = judge0Service.getSupportedLanguages();
    
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('❌ [JUDGE0] Get languages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages'
    });
  }
});

// Execute code
router.post('/execute', async (req, res) => {
  try {
    console.log('🚀 [JUDGE0] Executing code...');
    console.log('🔍 [JUDGE0] Request body:', {
      language: req.body.language,
      codeLength: req.body.code?.length,
      hasInput: !!req.body.input,
      hasExpectedOutput: !!req.body.expectedOutput
    });

    const { code, language, input = '', expectedOutput = '' } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    const result = await judge0Service.executeCode(code, language, input, expectedOutput);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [JUDGE0] Execute error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute code'
    });
  }
});

// Submit code (async)
router.post('/submit', async (req, res) => {
  try {
    console.log('📤 [JUDGE0] Submitting code...');
    console.log('🔍 [JUDGE0] Request body:', {
      language: req.body.language,
      codeLength: req.body.code?.length,
      hasInput: !!req.body.input,
      hasExpectedOutput: !!req.body.expectedOutput
    });

    const { code, language, input = '', expectedOutput = '' } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    const result = await judge0Service.submitCode(code, language, input, expectedOutput);

    if (result.success) {
      res.json({
        success: true,
        data: {
          token: result.token,
          message: result.message
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [JUDGE0] Submit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit code'
    });
  }
});

// Get result by token
router.get('/result/:token', async (req, res) => {
  try {
    console.log('🔍 [JUDGE0] Getting result for token:', req.params.token);

    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const result = await judge0Service.getResult(token);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [JUDGE0] Get result error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get result'
    });
  }
});

// Run test cases
router.post('/test-cases', async (req, res) => {
  try {
    console.log('🧪 [JUDGE0] Running test cases...');
    console.log('🔍 [JUDGE0] Request body:', {
      language: req.body.language,
      codeLength: req.body.code?.length,
      testCasesCount: req.body.testCases?.length
    });

    const { code, language, testCases = [] } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Test cases are required'
      });
    }

    const result = await judge0Service.runTestCases(code, language, testCases);

    if (result.success) {
      res.json({
        success: true,
        data: {
          results: result.results,
          summary: result.summary
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ [JUDGE0] Test cases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run test cases'
    });
  }
});

// Get starter code for language
router.get('/starter-code/:language', async (req, res) => {
  try {
    console.log('📝 [JUDGE0] Getting starter code for language:', req.params.language);

    const { language } = req.params;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required'
      });
    }

    const starterCode = judge0Service.getStarterCode(language);

    res.json({
      success: true,
      data: {
        language: language,
        starterCode: starterCode
      }
    });

  } catch (error) {
    console.error('❌ [JUDGE0] Get starter code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get starter code'
    });
  }
});

// Proxy endpoint for direct Judge0 submissions (matches Judge0 API format)
router.post('/submissions', async (req, res) => {
  try {
    console.log('📤 [JUDGE0 PROXY] Proxying submission to Judge0...');
    console.log('📤 [JUDGE0 PROXY] Request body:', req.body);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const result = await judge0Service.submitCodeDirect(req.body);
    
    if (result.success) {
      console.log('✅ [JUDGE0 PROXY] Submission successful, token:', result.token);
      res.json({ token: result.token });
    } else {
      console.error('❌ [JUDGE0 PROXY] Submission failed:', result.error);
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ [JUDGE0 PROXY] Submission error:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
});

// Proxy endpoint for getting Judge0 submission results (matches Judge0 API format)
router.get('/submissions/:token', async (req, res) => {
  try {
    console.log('🔍 [JUDGE0 PROXY] Proxying result request to Judge0...');
    console.log('🔍 [JUDGE0 PROXY] Token:', req.params.token);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const result = await judge0Service.getResultDirect(req.params.token);
    
    if (result.success) {
      console.log('✅ [JUDGE0 PROXY] Result retrieved successfully');
      res.json(result.data);
    } else {
      console.error('❌ [JUDGE0 PROXY] Get result failed:', result.error);
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('❌ [JUDGE0 PROXY] Get result error:', error);
    res.status(500).json({ error: 'Failed to get result' });
  }
});

// OPTIONS handler for CORS preflight
router.options('/submissions', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});

router.options('/submissions/:token', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send();
});

// Health check
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 [JUDGE0] Health check...');

    // Try to get supported languages as a health check
    const languages = judge0Service.getSupportedLanguages();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        supportedLanguages: Object.keys(languages).length,
        judge0Url: 'http://51.21.187.99:2358'
      }
    });

  } catch (error) {
    console.error('❌ [JUDGE0] Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Judge0 service is not healthy'
    });
  }
});

module.exports = router;
