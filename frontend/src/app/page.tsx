import EndorsementForm from "@/components/EndorsementForm";
import CredentialFeed from "@/components/CredentialFeed";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              K
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400">
              KalaiChain
            </h1>
          </div>
          <div className="text-sm font-medium text-gray-500">
            Tamil Arts Credentialing
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Build Your On-Chain Legacy</h2>
          <p className="text-gray-600 max-w-2xl">
            KalaiChain verifies and tracks performance-art credentials for the Tamil arts scene. 
            Receive endorsements as XLM micro-payments tagged by your skill category.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <EndorsementForm />
          </div>
          <div>
            <CredentialFeed />
          </div>
        </div>
      </div>
    </main>
  );
}
