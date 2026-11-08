const appJson = require("./app.json");

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo && appJson.expo.extra),
      eas: {
        projectId: "940f7573-eed2-4dd0-970e-dee66193b4cd",
      },
    },
  },
};

