/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return process.env.NEXT_PUBLIC_BUILD_TAG || `build-${Date.now()}`;
  },
};

export default nextConfig;
