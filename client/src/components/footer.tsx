export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Disclaimer</h3>
            <p className="text-sm text-gray-600">
              Grocery Agent is an experimental tool that helps users compare prices across retailers in the UAE. We are not affiliated with or endorsed by Lulu Hypermarket, Carrefour, Noon, or Talabat. Prices and availability may vary and are provided for informational purposes.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Terms of Use</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• This tool is provided as-is and for informational purposes only.</li>
              <li>• Do not rely on price or availability data for any purchasing decisions.</li>
              <li>• Tool uses simulated data for demonstration purposes only. No guarantee of data accuracy or availability.</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
