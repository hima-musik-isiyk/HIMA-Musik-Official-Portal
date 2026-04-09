const locatorLoader = {
  loader: "@locator/webpack-loader",
  options: { env: "development" },
};

const locatorOverride =
  process.env.ENABLE_LOCATOR ?? process.env.NEXT_PUBLIC_ENABLE_LOCATOR;
const enableLocator =
  process.env.NODE_ENV === "development" && locatorOverride !== "false";

const nextConfig = {
  reactStrictMode: true,
  turbopack: enableLocator
    ? {
        rules: {
          "**/*.{tsx,jsx}": {
            loaders: [locatorLoader],
          },
        },
      }
    : {},
  webpack: (config, { dev, isServer }) => {
    if (enableLocator && dev && !isServer) {
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
