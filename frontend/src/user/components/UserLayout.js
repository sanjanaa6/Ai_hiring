import React from 'react';
import UserNavbar from './UserNavbar';

const UserLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
