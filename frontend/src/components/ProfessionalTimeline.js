import React from 'react';

/**
 * ProfessionalTimeline
 * Renders positions in rows of three with centered separator dots between rows
 * to mimic a horizontal timeline with pin-to-pin alignment as per the reference.
 */
const ProfessionalTimeline = ({ positions, isDarkMode }) => {
  if (!Array.isArray(positions) || positions.length === 0) return null;

  // Chunk positions into rows of three
  const rows = [];
  for (let i = 0; i < positions.length; i += 3) {
    rows.push(positions.slice(i, i + 3));
  }

  const cardBase = isDarkMode
    ? 'bg-gray-900 border border-gray-800'
    : 'bg-white border border-gray-200 shadow-md';

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-gray-600' : 'text-gray-600';

  return (
    <div className="w-full relative">
      {rows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="relative">
          {/* Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {row.map((position, idx) => (
              <div key={`pos-${rowIndex}-${idx}`} className="relative">
                {/* Vertical line from card to timeline dot */}
                {rowIndex < rows.length - 1 && (
                  <div className="hidden lg:flex justify-center absolute left-0 right-0 -bottom-8 h-8">
                    <div className={`w-px h-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                  </div>
                )}
                
                {/* Card */}
                <div className={`rounded-xl p-6 transition-all hover:shadow-xl ${cardBase}`}>
                  <div className="mb-2">
                    <p className={`text-xs mb-1 ${textSecondary}`}>{position.duration}</p>
                    <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{position.period}</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`${isDarkMode ? 'bg-white' : 'bg-black'} w-2 h-2 rounded-full mt-2 flex-shrink-0`}></div>
                    <div>
                      <h3 className={`text-lg font-bold mb-1 ${textPrimary}`}>{position.title}</h3>
                      <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{position.company}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline connector between rows */}
          {rowIndex < rows.length - 1 && (
            <div className="relative mb-8 hidden lg:block" aria-hidden>
              {/* Timeline dots aligned to cards */}
              <div className="grid grid-cols-3 gap-8 mb-2">
                {[0, 1, 2].map(i => (
                  <div key={`dot-${rowIndex}-${i}`} className="flex justify-center">
                    <div className={`${isDarkMode ? 'bg-gray-400' : 'bg-gray-700'} w-2.5 h-2.5 rounded-full z-10 relative`}></div>
                  </div>
                ))}
              </div>

              {/* Horizontal connecting line with curve */}
              <div className="relative h-16 -mt-3">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
                  <path
                    d="M 0 20 H 85 Q 100 20 100 50 Q 100 80 85 80 H 0"
                    fill="none"
                    stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Bottom dots aligned to cards */}
                <div className="absolute bottom-2 left-0 w-full">
                  <div className="grid grid-cols-3 gap-8">
                    {[0, 1, 2].map(i => (
                      <div key={`bottom-dot-${rowIndex}-${i}`} className="flex justify-center">
                        <div className={`${isDarkMode ? 'bg-gray-400' : 'bg-gray-700'} w-2.5 h-2.5 rounded-full z-10 relative`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vertical lines from bottom dots to next row cards */}
              <div className="grid grid-cols-3 gap-8">
                {[0, 1, 2].map(i => (
                  <div key={`line-to-next-${rowIndex}-${i}`} className="flex justify-center">
                    <div className={`w-px h-8 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfessionalTimeline;


