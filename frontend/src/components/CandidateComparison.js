import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Search
} from 'lucide-react';

const CandidateComparison = ({ candidates = [], interviewData }) => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [sortBy, setSortBy] = useState('overallScore');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const mockCandidates = [
    {
      id: 'candidate_1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      appliedAt: '2024-01-15',
      completedAt: '2024-01-16',
      overallScore: 8.5,
      rounds: [
        { roundId: 'round_1', score: 9, feedback: 'Excellent technical knowledge' },
        { roundId: 'round_2', score: 8, feedback: 'Strong communication skills' },
        { roundId: 'round_3', score: 9, feedback: 'Great problem-solving approach' },
        { roundId: 'round_4', score: 8, feedback: 'Good cultural fit' },
        { roundId: 'round_5', score: 9, feedback: 'Impressive technical skills' },
        { roundId: 'round_6', score: 8, feedback: 'Clear career goals' }
      ],
      strengths: ['Technical expertise', 'Problem solving', 'Communication'],
      improvements: ['Could be more specific in examples'],
      recommendation: 'Strong Hire',
      aiFeedback: 'John demonstrates exceptional technical skills and clear communication. His problem-solving approach is methodical and he shows strong cultural alignment. Highly recommended for the role.',
      status: 'completed'
    },
    {
      id: 'candidate_2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 234-5678',
      appliedAt: '2024-01-14',
      completedAt: '2024-01-15',
      overallScore: 7.2,
      rounds: [
        { roundId: 'round_1', score: 7, feedback: 'Good technical foundation' },
        { roundId: 'round_2', score: 8, feedback: 'Excellent behavioral examples' },
        { roundId: 'round_3', score: 6, feedback: 'Struggled with complex scenarios' },
        { roundId: 'round_4', score: 8, feedback: 'Great cultural fit' },
        { roundId: 'round_5', score: 7, feedback: 'Solid technical skills' },
        { roundId: 'round_6', score: 7, feedback: 'Good motivation' }
      ],
      strengths: ['Cultural fit', 'Behavioral examples', 'Motivation'],
      improvements: ['Complex problem solving', 'Technical depth'],
      recommendation: 'Maybe',
      aiFeedback: 'Sarah shows good cultural alignment and strong behavioral responses. However, she struggled with complex technical scenarios. Consider for a more junior role or additional training.',
      status: 'completed'
    },
    {
      id: 'candidate_3',
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      phone: '+1 (555) 345-6789',
      appliedAt: '2024-01-16',
      completedAt: '2024-01-17',
      overallScore: 6.8,
      rounds: [
        { roundId: 'round_1', score: 6, feedback: 'Basic technical knowledge' },
        { roundId: 'round_2', score: 7, feedback: 'Decent communication' },
        { roundId: 'round_3', score: 7, feedback: 'Good situational judgment' },
        { roundId: 'round_4', score: 6, feedback: 'Limited cultural alignment' },
        { roundId: 'round_5', score: 6, feedback: 'Basic technical skills' },
        { roundId: 'round_6', score: 8, feedback: 'Strong motivation' }
      ],
      strengths: ['Motivation', 'Situational judgment'],
      improvements: ['Technical skills', 'Cultural fit', 'Communication'],
      recommendation: 'No Hire',
      aiFeedback: 'Mike shows motivation but lacks the technical depth required for this role. His cultural fit is also questionable. Consider for a different position or additional training.',
      status: 'completed'
    }
  ];

  const candidatesToShow = candidates.length > 0 ? candidates : mockCandidates;

  const filteredCandidates = candidatesToShow.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'completed' && candidate.status === 'completed') ||
                         (filterBy === 'in-progress' && candidate.status === 'in-progress') ||
                         (filterBy === 'strong-hire' && candidate.recommendation === 'Strong Hire') ||
                         (filterBy === 'maybe' && candidate.recommendation === 'Maybe') ||
                         (filterBy === 'no-hire' && candidate.recommendation === 'No Hire');
    return matchesSearch && matchesFilter;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    switch (sortBy) {
      case 'overallScore':
        return b.overallScore - a.overallScore;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'appliedAt':
        return new Date(b.appliedAt) - new Date(a.appliedAt);
      default:
        return 0;
    }
  });

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'Strong Hire':
        return 'text-green-600 bg-green-100';
      case 'Maybe':
        return 'text-yellow-600 bg-yellow-100';
      case 'No Hire':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Comparison</h2>
          <p className="text-gray-600">Review and compare candidate performance</p>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Candidates</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="strong-hire">Strong Hire</option>
              <option value="maybe">Maybe</option>
              <option value="no-hire">No Hire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overallScore">Overall Score</option>
              <option value="name">Name</option>
              <option value="appliedAt">Applied Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {sortedCandidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => toggleCandidateSelection(candidate.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                  <p className="text-gray-600">{candidate.email}</p>
                  <p className="text-sm text-gray-500">{candidate.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidate.overallScore)}`}>
                    <Star className="h-4 w-4 mr-1" />
                    {candidate.overallScore}/10
                  </div>
                  <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(candidate.recommendation)}`}>
                    {candidate.recommendation}
                  </div>
                </div>
              </div>
            </div>

            {/* Round Scores */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Round Performance</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {candidate.rounds?.map((round, index) => (
                  <div key={round.roundId} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Round {index + 1}</div>
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${getScoreColor(round.score)}`}>
                      {round.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Feedback */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">AI Feedback</h4>
              <p className="text-sm text-gray-700">{candidate.aiFeedback}</p>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {candidate.strengths?.map((strength, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {candidate.improvements?.map((improvement, index) => (
                    <li key={index} className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Applied: {new Date(candidate.appliedAt).toLocaleDateString()} • 
                Completed: {new Date(candidate.completedAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <button className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  <span>Contact</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Summary */}
      {selectedCandidates.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparison Summary ({selectedCandidates.length} candidates selected)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedCandidates.length}
              </div>
              <div className="text-sm text-gray-600">Candidates Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedCandidates.filter(id => 
                  candidatesToShow.find(c => c.id === id)?.recommendation === 'Strong Hire'
                ).length}
              </div>
              <div className="text-sm text-gray-600">Strong Hires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {selectedCandidates.filter(id => 
                  candidatesToShow.find(c => c.id === id)?.recommendation === 'Maybe'
                ).length}
              </div>
              <div className="text-sm text-gray-600">Maybe</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateComparison;
