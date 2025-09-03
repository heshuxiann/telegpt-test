// export default function (api) {
//   api.cache(true);

//   const isTest = process.env.APP_ENV === 'test';
//   const isMocked = Boolean(process.env.APP_MOCKED_CLIENT);

//   const presets = [
//     '@babel/typescript',
//     '@babel/preset-env',
//     [
//       '@babel/preset-react',
//       {
//         runtime: 'automatic',
//         importSource: '@teact',
//       },
//     ],
//   ];

//   const plugins = [
//     ...(isTest && !isMocked ? ['babel-plugin-transform-import-meta'] : []),
//   ];

//   return {
//     presets,
//     plugins,
//   };
// }
const isTest = process.env.APP_ENV === 'test';
const isMocked = Boolean(process.env.APP_MOCKED_CLIENT);

module.exports = {
  presets: [
    [
      '@babel/typescript',
    ],
    [
      '@babel/preset-env',
    ],
    [
      '@babel/preset-react',
    ],
  ],
  plugins: [
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-syntax-nullish-coalescing-operator',
    '@babel/plugin-transform-logical-assignment-operators',
    ...(isTest && !isMocked ? ['babel-plugin-transform-import-meta'] : []),
  ],
};
