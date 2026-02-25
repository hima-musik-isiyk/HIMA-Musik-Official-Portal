const locatorLoader = {
  loader: "@locator/webpack-loader",
  options: { env: "development" },
};

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    rules: {
      "**/*.{tsx,jsx}": {
        loaders: [locatorLoader],
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.module.rules.push({
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: /node_modules/,
        use: [locatorLoader],
      });
    }

    return config;
  },
};

export default nextConfig;
