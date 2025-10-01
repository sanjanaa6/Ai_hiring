import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  Copy, 
  Download,
  RefreshCw,
  Target,
  Clock,
  Star
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import codeExecutionService from '../services/codeExecutionService';

const CodingChallengeGenerator = ({ onChallengeSelect }) => {
  const { isDarkMode } = useTheme();
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  const codingChallenges = [
    {
      id: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Given an array of integers and a target sum, return the indices of the two numbers that add up to the target.',
      starterCode: `function twoSum(nums, target) {
  // Your code here
  // Return an array of two indices
}`,
      testCases: [
        {
          input: [[2, 7, 11, 15], 9],
          expected: [0, 1],
          description: 'Basic two sum test case'
        },
        {
          input: [[3, 2, 4], 6],
          expected: [1, 2],
          description: 'Another two sum test case'
        },
        {
          input: [[3, 3], 6],
          expected: [0, 1],
          description: 'Same number test case'
        }
      ],
      functionName: 'twoSum',
      timeLimit: 5,
      hints: [
        'Use a hash map to store numbers and their indices',
        'For each number, check if target - number exists in the map',
        'Return the indices when you find a match'
      ]
    },
    {
      id: 'fibonacci',
      title: 'Fibonacci Sequence',
      difficulty: 'Easy',
      description: 'Calculate the nth Fibonacci number using an efficient algorithm.',
      starterCode: `function fibonacci(n) {
  // Your code here
  // Return the nth Fibonacci number
}`,
      testCases: [
        {
          input: [0],
          expected: 0,
          description: 'Fibonacci of 0'
        },
        {
          input: [1],
          expected: 1,
          description: 'Fibonacci of 1'
        },
        {
          input: [5],
          expected: 5,
          description: 'Fibonacci of 5'
        },
        {
          input: [10],
          expected: 55,
          description: 'Fibonacci of 10'
        }
      ],
      functionName: 'fibonacci',
      timeLimit: 3,
      hints: [
        'Use dynamic programming to avoid recalculating values',
        'Base cases: fib(0) = 0, fib(1) = 1',
        'For n > 1: fib(n) = fib(n-1) + fib(n-2)'
      ]
    },
    {
      id: 'palindrome',
      title: 'Palindrome Checker',
      difficulty: 'Easy',
      description: 'Check if a string is a palindrome (reads the same forwards and backwards).',
      starterCode: `function isPalindrome(str) {
  // Your code here
  // Return true if palindrome, false otherwise
}`,
      testCases: [
        {
          input: ['racecar'],
          expected: true,
          description: 'Palindrome word'
        },
        {
          input: ['hello'],
          expected: false,
          description: 'Non-palindrome word'
        },
        {
          input: ['A man a plan a canal Panama'],
          expected: true,
          description: 'Palindrome with spaces'
        },
        {
          input: [''],
          expected: true,
          description: 'Empty string'
        }
      ],
      functionName: 'isPalindrome',
      timeLimit: 2,
      hints: [
        'Remove spaces and convert to lowercase',
        'Use two pointers from start and end',
        'Compare characters while moving pointers inward'
      ]
    },
    {
      id: 'binary-search',
      title: 'Binary Search',
      difficulty: 'Medium',
      description: 'Implement binary search to find a target value in a sorted array.',
      starterCode: `function binarySearch(arr, target) {
  // Your code here
  // Return the index of target, or -1 if not found
}`,
      testCases: [
        {
          input: [[1, 2, 3, 4, 5], 3],
          expected: 2,
          description: 'Target found in middle'
        },
        {
          input: [[1, 2, 3, 4, 5], 6],
          expected: -1,
          description: 'Target not found'
        },
        {
          input: [[1, 2, 3, 4, 5], 1],
          expected: 0,
          description: 'Target found at start'
        },
        {
          input: [[1, 2, 3, 4, 5], 5],
          expected: 4,
          description: 'Target found at end'
        }
      ],
      functionName: 'binarySearch',
      timeLimit: 4,
      hints: [
        'Use left and right pointers',
        'Calculate middle index: (left + right) / 2',
        'Adjust pointers based on comparison with target'
      ]
    },
    {
      id: 'merge-sort',
      title: 'Merge Sort',
      difficulty: 'Medium',
      description: 'Implement merge sort algorithm to sort an array of integers.',
      starterCode: `function mergeSort(arr) {
  // Your code here
  // Return the sorted array
}`,
      testCases: [
        {
          input: [[64, 34, 25, 12, 22, 11, 90]],
          expected: [11, 12, 22, 25, 34, 64, 90],
          description: 'Unsorted array'
        },
        {
          input: [[1, 2, 3, 4, 5]],
          expected: [1, 2, 3, 4, 5],
          description: 'Already sorted array'
        },
        {
          input: [[5, 4, 3, 2, 1]],
          expected: [1, 2, 3, 4, 5],
          description: 'Reverse sorted array'
        },
        {
          input: [[1]],
          expected: [1],
          description: 'Single element array'
        }
      ],
      functionName: 'mergeSort',
      timeLimit: 6,
      hints: [
        'Divide the array into two halves',
        'Recursively sort both halves',
        'Merge the sorted halves back together'
      ]
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'Hard': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const handleChallengeSelect = (challenge) => {
    setSelectedChallenge(challenge);
    if (onChallengeSelect) {
      onChallengeSelect(challenge);
    }
  };

  const copyChallenge = (challenge) => {
    const challengeText = `Title: ${challenge.title}
Difficulty: ${challenge.difficulty}
Description: ${challenge.description}

Starter Code:
${challenge.starterCode}

Test Cases:
${challenge.testCases.map((test, index) => 
  `Test ${index + 1}: ${test.description}
Input: ${JSON.stringify(test.input)}
Expected: ${JSON.stringify(test.expected)}`
).join('\n\n')}`;

    navigator.clipboard.writeText(challengeText);
  };

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Coding Challenges
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Select a coding challenge to practice with test cases
        </p>
      </div>

      <div className="grid gap-4">
        {codingChallenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`p-4 rounded-lg border transition-all cursor-pointer ${
              selectedChallenge?.id === challenge.id
                ? isDarkMode
                  ? 'bg-blue-900/30 border-blue-500/50'
                  : 'bg-blue-50 border-blue-200'
                : isDarkMode
                  ? 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleChallengeSelect(challenge)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {challenge.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="h-4 w-4" />
                    <span className="text-xs">{challenge.timeLimit}min</span>
                  </div>
                </div>
                
                <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {challenge.description}
                </p>

                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-blue-500" />
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {challenge.testCases.length} test cases
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-green-500" />
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {challenge.timeLimit} min limit
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyChallenge(challenge);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    isDarkMode 
                      ? 'hover:bg-slate-600 text-slate-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChallengeSelect(challenge);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                    selectedChallenge?.id === challenge.id
                      ? 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <Play className="h-4 w-4" />
                  <span>Select</span>
                </button>
              </div>
            </div>

            {/* Hints */}
            {selectedChallenge?.id === challenge.id && (
              <div className={`mt-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-600/50' : 'bg-gray-100'
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  💡 Hints:
                </h4>
                <ul className="space-y-1">
                  {challenge.hints.map((hint, index) => (
                    <li key={index} className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {index + 1}. {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodingChallengeGenerator;
