import apiService from './apiService';

class AILanguageDetectionService {
  constructor() {
    this.baseURL = '/api/ai';
  }

  // Enhanced AI-powered language detection
  async detectLanguageFromJobDescription(jobDescription, jobTitle = '') {
    try {
      // Use axios directly since apiService doesn't have a direct post method
      const response = await apiService.client.post('/ai/detect-language', {
        jobDescription,
        jobTitle,
        context: 'coding_interview'
      });
      
      if (response.data && response.data.success) {
        return {
          language: response.data.data.language,
          confidence: response.data.data.confidence,
          reasoning: response.data.data.reasoning,
          alternatives: response.data.data.alternatives || []
        };
      }
      
      // Fallback to local detection
      return this.localLanguageDetection(jobDescription, jobTitle);
    } catch (error) {
      console.error('AI Language Detection Error:', error);
      return this.localLanguageDetection(jobDescription, jobTitle);
    }
  }

  // Enhanced local language detection with better patterns
  localLanguageDetection(jobDescription, jobTitle = '') {
    const text = `${jobTitle} ${jobDescription}`.toLowerCase();
    
    const languagePatterns = [
      // Python (highest priority for data science, ML, backend)
      {
        language: 'python',
        patterns: [
          { keywords: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'celery', 'py'], weight: 4 },
          { keywords: ['data science', 'machine learning', 'ai', 'ml', 'data analysis', 'jupyter', 'anaconda'], weight: 3 },
          { keywords: ['backend', 'api', 'server', 'microservices'], weight: 2 },
          { keywords: ['automation', 'scripting', 'devops'], weight: 1 }
        ],
        icon: '🐍',
        color: 'bg-green-500'
      },
      
      // React/JSX (frontend development)
      {
        language: 'jsx',
        patterns: [
          { keywords: ['react', 'jsx', 'tsx', 'react.js', 'reactjs', 'next.js', 'nextjs', 'gatsby', 'remix'], weight: 4 },
          { keywords: ['frontend', 'component', 'hooks', 'redux', 'zustand', 'context'], weight: 3 },
          { keywords: ['ui', 'user interface', 'web app', 'spa', 'single page'], weight: 2 }
        ],
        icon: '⚛️',
        color: 'bg-blue-500'
      },
      
      // TypeScript (type-safe development)
      {
        language: 'typescript',
        patterns: [
          { keywords: ['typescript', 'ts', 'angular', 'nestjs', 'deno'], weight: 4 },
          { keywords: ['type safety', 'interface', 'generic', 'enum'], weight: 3 },
          { keywords: ['enterprise', 'large scale', 'maintainable'], weight: 2 }
        ],
        icon: '🔷',
        color: 'bg-blue-600'
      },
      
      // JavaScript (general web development)
      {
        language: 'javascript',
        patterns: [
          { keywords: ['javascript', 'js', 'node.js', 'nodejs', 'express', 'vue', 'vue.js', 'vuejs', 'nuxt'], weight: 4 },
          { keywords: ['vanilla js', 'es6', 'es2015', 'es2020', 'webpack', 'babel'], weight: 3 },
          { keywords: ['frontend', 'backend', 'fullstack', 'web development'], weight: 2 }
        ],
        icon: '🟨',
        color: 'bg-yellow-500'
      },
      
      // Java (enterprise development)
      {
        language: 'java',
        patterns: [
          { keywords: ['java', 'spring', 'spring boot', 'hibernate', 'maven', 'gradle', 'jpa'], weight: 4 },
          { keywords: ['jvm', 'enterprise', 'microservices', 'rest api'], weight: 3 },
          { keywords: ['oop', 'object oriented', 'design patterns'], weight: 2 }
        ],
        icon: '☕',
        color: 'bg-orange-500'
      },
      
      // C# (.NET development)
      {
        language: 'csharp',
        patterns: [
          { keywords: ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'entity framework', 'blazor'], weight: 4 },
          { keywords: ['xamarin', 'azure', 'microsoft', 'visual studio'], weight: 3 },
          { keywords: ['enterprise', 'windows', 'desktop'], weight: 2 }
        ],
        icon: '💜',
        color: 'bg-purple-600'
      },
      
      // C++ (system programming)
      {
        language: 'cpp',
        patterns: [
          { keywords: ['c++', 'cpp', 'c plus plus', 'qt', 'boost', 'cmake'], weight: 4 },
          { keywords: ['system programming', 'performance', 'embedded', 'game development'], weight: 3 },
          { keywords: ['memory management', 'low level', 'optimization'], weight: 2 }
        ],
        icon: '⚡',
        color: 'bg-purple-500'
      },
      
      // Go (modern backend)
      {
        language: 'go',
        patterns: [
          { keywords: ['go', 'golang', 'gin', 'echo', 'gorilla', 'fiber'], weight: 4 },
          { keywords: ['microservices', 'backend', 'api', 'concurrent'], weight: 3 },
          { keywords: ['cloud native', 'docker', 'kubernetes'], weight: 2 }
        ],
        icon: '🐹',
        color: 'bg-cyan-500'
      },
      
      // PHP (web development)
      {
        language: 'php',
        patterns: [
          { keywords: ['php', 'laravel', 'symfony', 'codeigniter', 'wordpress', 'drupal'], weight: 4 },
          { keywords: ['web development', 'backend', 'cms'], weight: 3 },
          { keywords: ['server side', 'dynamic'], weight: 2 }
        ],
        icon: '🐘',
        color: 'bg-indigo-500'
      },
      
      // Ruby (web development)
      {
        language: 'ruby',
        patterns: [
          { keywords: ['ruby', 'rails', 'ruby on rails', 'sinatra', 'hanami'], weight: 4 },
          { keywords: ['web development', 'backend', 'mvc'], weight: 3 },
          { keywords: ['startup', 'rapid development'], weight: 2 }
        ],
        icon: '💎',
        color: 'bg-red-500'
      },
      
      // Swift (iOS development)
      {
        language: 'swift',
        patterns: [
          { keywords: ['swift', 'ios', 'xcode', 'cocoa', 'swiftui', 'uikit'], weight: 4 },
          { keywords: ['mobile development', 'apple', 'iphone', 'ipad'], weight: 3 },
          { keywords: ['app store', 'mobile app'], weight: 2 }
        ],
        icon: '🦉',
        color: 'bg-orange-400'
      },
      
      // Kotlin (Android development)
      {
        language: 'kotlin',
        patterns: [
          { keywords: ['kotlin', 'android', 'jetpack', 'compose', 'coroutines'], weight: 4 },
          { keywords: ['mobile development', 'android development', 'google'], weight: 3 },
          { keywords: ['play store', 'mobile app'], weight: 2 }
        ],
        icon: '🟣',
        color: 'bg-purple-500'
      },
      
      // Rust (system programming)
      {
        language: 'rust',
        patterns: [
          { keywords: ['rust', 'cargo', 'tokio', 'actix', 'serde'], weight: 4 },
          { keywords: ['system programming', 'performance', 'memory safety'], weight: 3 },
          { keywords: ['webassembly', 'blockchain'], weight: 2 }
        ],
        icon: '🦀',
        color: 'bg-orange-600'
      },
      
      // Scala (functional programming)
      {
        language: 'scala',
        patterns: [
          { keywords: ['scala', 'akka', 'play', 'spark', 'sbt'], weight: 4 },
          { keywords: ['functional programming', 'big data', 'distributed'], weight: 3 },
          { keywords: ['jvm', 'enterprise'], weight: 2 }
        ],
        icon: '🔺',
        color: 'bg-red-600'
      }
    ];
    
    let bestMatch = { language: 'javascript', score: 0, confidence: 0 };
    let allScores = [];
    
    for (const { language, patterns } of languagePatterns) {
      let score = 0;
      for (const { keywords, weight } of patterns) {
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            score += weight;
          }
        }
      }
      
      allScores.push({ language, score });
      
      if (score > bestMatch.score) {
        bestMatch = { language, score };
      }
    }
    
    // Calculate confidence based on score difference
    const sortedScores = allScores.sort((a, b) => b.score - a.score);
    const topScore = sortedScores[0]?.score || 0;
    const secondScore = sortedScores[1]?.score || 0;
    
    let confidence = 0;
    if (topScore > 0) {
      confidence = Math.min(95, Math.max(60, (topScore / (topScore + secondScore + 1)) * 100));
    }
    
    const languageInfo = languagePatterns.find(lang => lang.language === bestMatch.language);
    
    return {
      language: bestMatch.language,
      confidence: Math.round(confidence),
      reasoning: this.generateReasoning(bestMatch.language, text, bestMatch.score),
      alternatives: sortedScores.slice(1, 4).map(s => ({
        language: s.language,
        score: s.score,
        confidence: Math.round((s.score / (topScore + 1)) * 100)
      })),
      icon: languageInfo?.icon || '💻',
      color: languageInfo?.color || 'bg-gray-500'
    };
  }

  generateReasoning(language, text, score) {
    const reasons = {
      python: [
        'Python is perfect for data science and machine learning roles',
        'Great choice for backend API development',
        'Excellent for automation and scripting tasks'
      ],
      jsx: [
        'React is the most popular frontend framework',
        'Perfect for building modern web applications',
        'Great for component-based UI development'
      ],
      typescript: [
        'TypeScript provides excellent type safety',
        'Perfect for large-scale applications',
        'Great for enterprise development'
      ],
      javascript: [
        'JavaScript is the language of the web',
        'Perfect for full-stack development',
        'Great for both frontend and backend'
      ],
      java: [
        'Java is excellent for enterprise applications',
        'Perfect for microservices architecture',
        'Great for large-scale backend systems'
      ],
      csharp: [
        'C# is perfect for .NET development',
        'Excellent for enterprise applications',
        'Great for Microsoft ecosystem'
      ],
      cpp: [
        'C++ is perfect for system programming',
        'Excellent for performance-critical applications',
        'Great for embedded and game development'
      ],
      go: [
        'Go is perfect for modern backend development',
        'Excellent for microservices and APIs',
        'Great for cloud-native applications'
      ],
      php: [
        'PHP is perfect for web development',
        'Excellent for content management systems',
        'Great for rapid web application development'
      ],
      ruby: [
        'Ruby is perfect for web development',
        'Excellent for rapid prototyping',
        'Great for startup environments'
      ],
      swift: [
        'Swift is perfect for iOS development',
        'Excellent for mobile app development',
        'Great for Apple ecosystem'
      ],
      kotlin: [
        'Kotlin is perfect for Android development',
        'Excellent for modern mobile apps',
        'Great for Google ecosystem'
      ],
      rust: [
        'Rust is perfect for system programming',
        'Excellent for performance and safety',
        'Great for modern system development'
      ],
      scala: [
        'Scala is perfect for functional programming',
        'Excellent for big data processing',
        'Great for distributed systems'
      ]
    };
    
    const languageReasons = reasons[language] || ['Great choice for this role!'];
    return languageReasons[Math.floor(Math.random() * languageReasons.length)];
  }

  // Get language-specific starter code
  getStarterCodeForLanguage(language) {
    const templates = {
      javascript: `// Welcome to JavaScript! 🚀
function solution() {
    // Write your code here
    // This is where the magic happens!
    return null;
}

// Example usage:
// console.log(solution());`,
      
      jsx: `// Welcome to React! ⚛️
import React from 'react';

const Solution = () => {
    // Write your React component here
    return (
        <div>
            <h1>Hello, React!</h1>
            {/* Your JSX code goes here */}
        </div>
    );
};

export default Solution;`,
      
      typescript: `// Welcome to TypeScript! 🔷
interface SolutionProps {
    // Define your props here
}

function solution(): any {
    // Write your type-safe code here
    // TypeScript will help you catch errors!
    return null;
}

// Example usage:
// console.log(solution());`,
      
      python: `# Welcome to Python! 🐍
def solution():
    """
    Write your Python solution here
    Python is great for data science and automation!
    """
    # Your code goes here
    pass

# Example usage:
# print(solution())`,
      
      java: `// Welcome to Java! ☕
public class Solution {
    public static void main(String[] args) {
        // Write your Java code here
        // Java is perfect for enterprise applications!
        System.out.println("Hello, Java!");
    }
    
    public static void solution() {
        // Your solution method
    }
}`,
      
      cpp: `// Welcome to C++! ⚡
#include <iostream>
using namespace std;

int main() {
    // Write your C++ code here
    // C++ is perfect for system programming!
    cout << "Hello, C++!" << endl;
    return 0;
}

// Your solution function
void solution() {
    // Your code here
}`,
      
      csharp: `// Welcome to C#! 💜
using System;

class Program {
    static void Main() {
        // Write your C# code here
        // C# is perfect for .NET development!
        Console.WriteLine("Hello, C#!");
    }
    
    static void Solution() {
        // Your solution method
    }
}`,
      
      go: `// Welcome to Go! 🐹
package main

import "fmt"

func main() {
    // Write your Go code here
    // Go is perfect for modern backend development!
    fmt.Println("Hello, Go!")
}

// Your solution function
func solution() {
    // Your code here
}`,
      
      php: `<?php
// Welcome to PHP! 🐘

function solution() {
    // Write your PHP code here
    // PHP is perfect for web development!
    return null;
}

// Example usage:
// echo solution();
?>`,
      
      ruby: `# Welcome to Ruby! 💎
def solution
    # Write your Ruby code here
    # Ruby is perfect for web development!
    nil
end

# Example usage:
# puts solution`,
      
      swift: `// Welcome to Swift! 🦉
import Foundation

func solution() {
    // Write your Swift code here
    // Swift is perfect for iOS development!
    print("Hello, Swift!")
}

// Example usage:
// solution()`,
      
      kotlin: `// Welcome to Kotlin! 🟣
fun main() {
    // Write your Kotlin code here
    // Kotlin is perfect for Android development!
    println("Hello, Kotlin!")
}

// Your solution function
fun solution() {
    // Your code here
}`,
      
      rust: `// Welcome to Rust! 🦀
fn main() {
    // Write your Rust code here
    // Rust is perfect for system programming!
    println!("Hello, Rust!");
}

// Your solution function
fn solution() {
    // Your code here
}`,
      
      scala: `// Welcome to Scala! 🔺
object Solution {
    def main(args: Array[String]): Unit = {
        // Write your Scala code here
        // Scala is perfect for functional programming!
        println("Hello, Scala!")
    }
    
    def solution(): Unit = {
        // Your solution method
    }
}`
    };
    
    return templates[language] || templates.javascript;
  }

  // Get language display information
  getLanguageInfo(language) {
    const languageMap = {
      javascript: { label: 'JavaScript', icon: '🟨', color: 'bg-yellow-500' },
      jsx: { label: 'React (JSX)', icon: '⚛️', color: 'bg-blue-500' },
      typescript: { label: 'TypeScript', icon: '🔷', color: 'bg-blue-600' },
      python: { label: 'Python', icon: '🐍', color: 'bg-green-500' },
      java: { label: 'Java', icon: '☕', color: 'bg-orange-500' },
      cpp: { label: 'C++', icon: '⚡', color: 'bg-purple-500' },
      c: { label: 'C', icon: '🔧', color: 'bg-gray-500' },
      csharp: { label: 'C#', icon: '💜', color: 'bg-purple-600' },
      go: { label: 'Go', icon: '🐹', color: 'bg-cyan-500' },
      php: { label: 'PHP', icon: '🐘', color: 'bg-indigo-500' },
      ruby: { label: 'Ruby', icon: '💎', color: 'bg-red-500' },
      swift: { label: 'Swift', icon: '🦉', color: 'bg-orange-400' },
      kotlin: { label: 'Kotlin', icon: '🟣', color: 'bg-purple-500' },
      rust: { label: 'Rust', icon: '🦀', color: 'bg-orange-600' },
      scala: { label: 'Scala', icon: '🔺', color: 'bg-red-600' }
    };
    
    return languageMap[language] || { label: 'JavaScript', icon: '💻', color: 'bg-gray-500' };
  }
}

const aiLanguageDetectionService = new AILanguageDetectionService();
export default aiLanguageDetectionService;
