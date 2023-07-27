import { glob } from "glob";
import * as Mocha from "mocha";
import * as path from "path";

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 15000
  });

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((resolve, reject) => {
    let filesP = glob("**/**.test.js", { cwd: testsRoot });
    filesP.then(files => {
      console.error(files);
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        mocha.run((failures) => {
          process.exitCode = failures ? 1 : 0;
          if (failures > 0) {
            reject(new Error(`${failures} tests failed`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        process.exitCode = 1;
      }
    }).catch(error => {
      console.error(`failed to run tests ${error}`);
    });
  });
}
