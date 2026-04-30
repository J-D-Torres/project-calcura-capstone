/* Joseph St.John wrote the original version of this file */
/* Jonathan Torres updated the UI styling */
import logoImage from "../assets/logoImage.png";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-green-50 via-white to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Unlock Your Financial Health
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Calcura is the smart, simple way to track, manage, and grow your money.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Budget templates for every life stage
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                What-if scenario planning
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Personalized financial insights
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src={logoImage}
              alt="Calcura Logo"
              className="w-full max-w-sm object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
