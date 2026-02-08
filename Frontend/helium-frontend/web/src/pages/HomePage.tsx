import React from 'react';

const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">Welcome to Helium App</h1>
            <p className="text-lg">This is the home page of the Helium App.</p>
        </div>
    );
};

export default HomePage;