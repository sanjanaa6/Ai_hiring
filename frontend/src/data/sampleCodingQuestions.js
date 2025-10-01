// Sample coding questions with test cases for interviews

export const sampleCodingQuestions = [
  {
    _id: 'coding-1',
    question: 'Implement a function that finds two numbers in an array that add up to a target sum.',
    description: 'Given an array of integers and a target sum, return the indices of the two numbers that add up to the target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    type: 'coding',
    difficulty: 'Easy',
    timeLimit: 15, // minutes
    codeEditor: {
      enabled: true,
      language: 'javascript',
      starterCode: `function twoSum(nums, target) {
  // Your code here
  // Return an array of two indices
  // Example: return [0, 1] for indices 0 and 1
}`,
      testCases: [
        {
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
          description: 'Basic two sum test case',
          functionName: 'twoSum'
        },
        {
          input: [[3, 2, 4], 6],
          expected: [1, 2],
          description: 'Another two sum test case',
          functionName: 'twoSum'
        },
        {
          input: [[3, 3], 6],
          expected: [0, 1],
          description: 'Same number test case',
          functionName: 'twoSum'
        },
        {
          input: [[1, 2, 3, 4, 5], 8],
          expected: [2, 4],
          description: 'Larger array test case',
          functionName: 'twoSum'
        }
      ],
      hints: [
        'Use a hash map to store numbers and their indices',
        'For each number, check if target - number exists in the map',
        'Return the indices when you find a match'
      ],
      expectedTimeComplexity: 'O(n)',
      expectedSpaceComplexity: 'O(n)'
    }
  },
  {
    _id: 'coding-2',
    question: 'Write a function to check if a string is a palindrome.',
    description: 'A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward (ignoring spaces, punctuation, and capitalization).',
    type: 'coding',
    difficulty: 'Easy',
    timeLimit: 10,
    codeEditor: {
      enabled: true,
      language: 'javascript',
      starterCode: `function isPalindrome(str) {
  // Your code here
  // Return true if palindrome, false otherwise
  // Ignore spaces, punctuation, and case
}`,
      testCases: [
        {
          input: ['racecar'],
          expected: true,
          description: 'Simple palindrome word',
          functionName: 'isPalindrome'
        },
        {
          input: ['hello'],
          expected: false,
          description: 'Non-palindrome word',
          functionName: 'isPalindrome'
        },
        {
          input: ['A man a plan a canal Panama'],
          expected: true,
          description: 'Palindrome with spaces',
          functionName: 'isPalindrome'
        },
        {
          input: [''],
          expected: true,
          description: 'Empty string',
          functionName: 'isPalindrome'
        },
        {
          input: ['Madam, in Eden, I\'m Adam'],
          expected: true,
          description: 'Palindrome with punctuation',
          functionName: 'isPalindrome'
        }
      ],
      hints: [
        'Remove spaces and convert to lowercase',
        'Use two pointers from start and end',
        'Compare characters while moving pointers inward'
      ],
      expectedTimeComplexity: 'O(n)',
      expectedSpaceComplexity: 'O(1)'
    }
  },
  {
    _id: 'coding-3',
    question: 'Implement binary search to find a target value in a sorted array.',
    description: 'Binary search is an efficient algorithm for finding a target value in a sorted array. It works by repeatedly dividing the search interval in half.',
    type: 'coding',
    difficulty: 'Medium',
    timeLimit: 20,
    codeEditor: {
      enabled: true,
      language: 'javascript',
      starterCode: `function binarySearch(arr, target) {
  // Your code here
  // Return the index of target, or -1 if not found
  // Array is already sorted
}`,
      testCases: [
        {
          input: [[1, 2, 3, 4, 5], 3],
          expected: 2,
          description: 'Target found in middle',
          functionName: 'binarySearch'
        },
        {
          input: [[1, 2, 3, 4, 5], 6],
          expected: -1,
          description: 'Target not found',
          functionName: 'binarySearch'
        },
        {
          input: [[1, 2, 3, 4, 5], 1],
          expected: 0,
          description: 'Target found at start',
          functionName: 'binarySearch'
        },
        {
          input: [[1, 2, 3, 4, 5], 5],
          expected: 4,
          description: 'Target found at end',
          functionName: 'binarySearch'
        },
        {
          input: [[1, 3, 5, 7, 9], 4],
          expected: -1,
          description: 'Target not found in odd-length array',
          functionName: 'binarySearch'
        }
      ],
      hints: [
        'Use left and right pointers',
        'Calculate middle index: Math.floor((left + right) / 2)',
        'Adjust pointers based on comparison with target'
      ],
      expectedTimeComplexity: 'O(log n)',
      expectedSpaceComplexity: 'O(1)'
    }
  },
  {
    _id: 'coding-4',
    question: 'Write a function to calculate the nth Fibonacci number efficiently.',
    description: 'The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones, starting from 0 and 1.',
    type: 'coding',
    difficulty: 'Easy',
    timeLimit: 15,
    codeEditor: {
      enabled: true,
      language: 'javascript',
      starterCode: `function fibonacci(n) {
  // Your code here
  // Return the nth Fibonacci number
  // Use an efficient approach (not naive recursion)
}`,
      testCases: [
        {
          input: [0],
          expected: 0,
          description: 'Fibonacci of 0',
          functionName: 'fibonacci'
        },
        {
          input: [1],
          expected: 1,
          description: 'Fibonacci of 1',
          functionName: 'fibonacci'
        },
        {
          input: [5],
          expected: 5,
          description: 'Fibonacci of 5',
          functionName: 'fibonacci'
        },
        {
          input: [10],
          expected: 55,
          description: 'Fibonacci of 10',
          functionName: 'fibonacci'
        },
        {
          input: [20],
          expected: 6765,
          description: 'Fibonacci of 20',
          functionName: 'fibonacci'
        }
      ],
      hints: [
        'Use dynamic programming to avoid recalculating values',
        'Base cases: fib(0) = 0, fib(1) = 1',
        'For n > 1: fib(n) = fib(n-1) + fib(n-2)'
      ],
      expectedTimeComplexity: 'O(n)',
      expectedSpaceComplexity: 'O(1)'
    }
  }
];

// Helper function to get a random coding question
export const getRandomCodingQuestion = () => {
  const randomIndex = Math.floor(Math.random() * sampleCodingQuestions.length);
  return sampleCodingQuestions[randomIndex];
};

// Helper function to get questions by difficulty
export const getCodingQuestionsByDifficulty = (difficulty) => {
  return sampleCodingQuestions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
};

// Helper function to create a coding round with multiple questions
export const createCodingRound = (title = 'Technical Coding Round', questions = null) => {
  const selectedQuestions = questions || sampleCodingQuestions.slice(0, 3);
  
  return {
    _id: `coding-round-${Date.now()}`,
    title,
    description: 'Solve coding problems with test cases and get instant feedback',
    type: 'coding',
    questions: selectedQuestions,
    timeLimit: selectedQuestions.reduce((total, q) => total + (q.timeLimit || 15), 0),
    instructions: [
      'Read each problem carefully',
      'Write clean, efficient code',
      'Test your solution with the provided test cases',
      'Consider edge cases and time complexity',
      'Ask questions if you need clarification'
    ]
  };
};
