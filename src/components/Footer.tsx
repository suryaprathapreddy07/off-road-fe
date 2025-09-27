import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-orange-600 mb-4">
              Off-Road Adventures
            </h3>
            <p className="text-gray-300 mb-4">
              Join the ultimate off-road adventures. Experience the thrill of
              challenging terrains, meet fellow adventure enthusiasts, and
              create unforgettable memories.
            </p>
            <div className="flex space-x-4">
              <span className="text-gray-400">Follow us:</span>
              {/* Social media icons would go here */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/events"
                  className="text-gray-300 hover:text-orange-600"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-gray-300 hover:text-orange-600"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-orange-600"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="text-gray-300 hover:text-orange-600"
                >
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-gray-300">
              <li>📧 info@offroad-adventures.com</li>
              <li>📞 +1 (555) 123-4567</li>
              <li>📍 Adventure City, AC 12345</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Off-Road Adventures. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
