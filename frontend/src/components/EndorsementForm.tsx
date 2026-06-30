"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export default function EndorsementForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Simulate contract call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to endorse artist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Endorse an Artist</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="artist-address" className="block text-sm font-medium text-gray-700 mb-1">
            Artist Stellar Address
          </label>
          <input
            id="artist-address"
            type="text"
            required
            placeholder="G..."
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div>
          <label htmlFor="skill-category" className="block text-sm font-medium text-gray-700 mb-1">
            Skill Category
          </label>
          <select
            id="skill-category"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-white"
          >
            <option value="">Select a skill</option>
            <option value="Mime">Mime</option>
            <option value="Bharatanatyam">Bharatanatyam</option>
            <option value="Carnatic Music">Carnatic Music</option>
            <option value="Theatre">Theatre</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (XLM)
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            required
            placeholder="10"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
            Endorsement successful!
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-colors disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Endorsement
            </>
          )}
        </button>
      </form>
    </div>
  );
}
