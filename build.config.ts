const unbuild = require("unbuild");

export default unbuild.defineBuildConfig({
  entries: ["index.ts"],
  clean: true,
  rollup: {
    output: {
      format: "esm",
    },
  },
});
