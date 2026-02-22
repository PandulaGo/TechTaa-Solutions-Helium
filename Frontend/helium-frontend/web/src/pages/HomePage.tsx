import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-xl text-center bg-white rounded-lg shadow-md px-6 py-10">
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">Welcome to Helium App</h1>
                <p className="text-base sm:text-lg mb-6 text-gray-700">This is the home page of the Helium App.</p>
                <Link
                    to="/login"
                    className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md"
                >
                    Go to Login
                </Link>
            </div>
        </div>
    );
};

export default HomePage;