/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  outputDir: 'docs',
  publicPath: process.env.NODE_ENV === "production" ? "/v-movable/" : "/",
}

