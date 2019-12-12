const core = require("@actions/core");
const aws = require("aws-sdk");
const fs = require("fs");

const secretName = core.getInput("SECRET_NAME");
const secretsManager = new aws.SecretsManager({
  accessKeyId: core.getInput("AWS_ACCESS_KEY_ID"),
  secretAccessKey: core.getInput("AWS_SECRET_ACCESS_KEY"),
  region: core.getInput("AWS_DEFAULT_REGION")
});

async function getSecretValue(secretsManager, secretName) {
  return secretsManager.getSecretValue({ SecretId: secretName }).promise();
}

getSecretValue(secretsManager, secretName)
  .then(resp => {
    const secret = resp.SecretString;

    if (secret) {
      const parsedSecret = JSON.parse(secret);
      let envFile = "";
      Object.entries(parsedSecret).forEach(([key, value]) => {
        envFile += `${key}=${value}\n`;
        core.setSecret(value);
        core.exportVariable(key, value);
      });
      fs.writeFileSync(`${core.getInput("APP_DIR") || "."}/.env`, envFile);
      console.log("envFile", envFile);
    } else {
      core.warning(`${secretName} has no secret values`);
    }
  })
  .catch(err => {
    core.setFailed(err);
  });

exports.getSecretValue = getSecretValue;
