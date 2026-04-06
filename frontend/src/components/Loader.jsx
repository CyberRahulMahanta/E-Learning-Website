import React from "react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-fuchsia-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default Loader;
