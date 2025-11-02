import React, { useState, useEffect } from 'react';

export default function CategorySurvey() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [otherText, setOtherText] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [errorMessage, setErrorMessage] = useState('');

  // Load categories from streamSchedule.json
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/streamSchedule.json');
        if (!response.ok) {
          throw new Error('Failed to load schedule');
        }
        const data = await response.json();
        
        // Extract all category names from categories object
        const categoryNames = Object.keys(data.categories || {});
        setCategories(categoryNames);
      } catch (err) {
        console.error('Error loading categories:', err);
        setErrorMessage('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryToggle = (category) => {
    if (category === 'Other') {
      setIsOtherSelected(!isOtherSelected);
      if (!isOtherSelected) {
        setSelectedCategories(prev => [...prev, 'Other']);
      } else {
        setSelectedCategories(prev => prev.filter(c => c !== 'Other'));
        setOtherText('');
      }
    } else {
      setSelectedCategories(prev => {
        if (prev.includes(category)) {
          return prev.filter(c => c !== category);
        } else {
          return [...prev, category];
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one category selected
    if (selectedCategories.length === 0) {
      setSubmitStatus('error');
      setErrorMessage('Please select at least one category');
      return;
    }

    // Validate other text if Other is selected
    if (isOtherSelected && !otherText.trim()) {
      setSubmitStatus('error');
      setErrorMessage('Please specify what "Other" category you have in mind');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitStatus(null);
      setErrorMessage('');

      const response = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: selectedCategories,
          otherText: isOtherSelected ? otherText.trim() : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('success');
        // Reset form
        setSelectedCategories([]);
        setIsOtherSelected(false);
        setOtherText('');
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.error || 'Failed to submit survey');
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-retro-cyan border-t-transparent mb-4"></div>
        <p className="retro-text text-retro-muted">Loading categories...</p>
      </div>
    );
  }

  if (errorMessage && !loading) {
    return (
      <div className="text-center py-8 bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Categories</h3>
        <p className="text-red-300">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="retro-container p-6 retro-glow">
      <h2 className="retro-title text-2xl font-bold text-retro-cyan mb-2">
        Stream Category Survey
      </h2>
      <p className="retro-text text-retro-muted mb-6">
        Which stream categories do you like most and want to see more of? Select all that apply!
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 mb-6">
          {categories.map((category) => (
            <label
              key={category}
              className="flex items-center retro-card p-4 cursor-pointer hover:shadow-glow transition-all duration-200 hover:scale-[1.02]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-5 h-5 text-retro-cyan rounded border-gray-300 focus:ring-retro-cyan focus:ring-2"
              />
              <span className="ml-3 text-lg font-semibold text-retro-text">
                {category}
              </span>
            </label>
          ))}

          {/* Other option */}
          <label className="flex items-start retro-card p-4 cursor-pointer hover:shadow-glow transition-all duration-200 hover:scale-[1.02]">
            <input
              type="checkbox"
              checked={isOtherSelected}
              onChange={() => handleCategoryToggle('Other')}
              className="w-5 h-5 mt-1 text-retro-cyan rounded border-gray-300 focus:ring-retro-cyan focus:ring-2"
            />
            <div className="ml-3 flex-grow">
              <span className="text-lg font-semibold text-retro-text block mb-2">
                Other
              </span>
              {isOtherSelected && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Please specify..."
                  className="w-full px-4 py-2 bg-retro-bg border-2 border-retro-cyan rounded text-retro-text placeholder-retro-muted focus:outline-none focus:ring-2 focus:ring-retro-cyan"
                />
              )}
            </div>
          </label>
        </div>

        {/* Error Message */}
        {submitStatus === 'error' && errorMessage && (
          <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500 rounded-lg">
            <p className="text-red-300">{errorMessage}</p>
          </div>
        )}

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="mb-4 p-4 bg-green-900/20 border-2 border-green-500 rounded-lg">
            <p className="text-green-300 font-semibold">
              ✅ Thank you! Your survey response has been submitted.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || selectedCategories.length === 0}
          className="w-full retro-button hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Submitting...
            </div>
          ) : (
            'Submit Survey'
          )}
        </button>
      </form>
    </div>
  );
}
