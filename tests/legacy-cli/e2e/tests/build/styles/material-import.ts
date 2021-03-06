import { getGlobalVariable } from '../../../utils/env';
import { replaceInFile, writeMultipleFiles } from '../../../utils/fs';
import { installWorkspacePackages } from '../../../utils/packages';
import { ng } from '../../../utils/process';
import { isPrereleaseCli, updateJsonFile } from '../../../utils/project';

const snapshots = require('../../../ng-snapshot/package.json');

export default async function () {
  // TODO(architect): Delete this test. It is now in devkit/build-angular.

  const isSnapshotBuild = getGlobalVariable('argv')['ng-snapshots'];
  const tag = (await isPrereleaseCli()) ? 'next' : 'latest';

  await updateJsonFile('package.json', (packageJson) => {
    const dependencies = packageJson['dependencies'];
    dependencies['@angular/material'] = isSnapshotBuild
      ? snapshots.dependencies['@angular/material']
      : tag;
    dependencies['@angular/cdk'] = isSnapshotBuild ? snapshots.dependencies['@angular/cdk'] : tag;
  });

  await installWorkspacePackages();

  for (const ext of ['css', 'scss', 'less', 'styl']) {
    await writeMultipleFiles({
      [`src/styles.${ext}`]: '@import "~@angular/material/prebuilt-themes/indigo-pink.css";',
      [`src/app/app.component.${ext}`]:
        '@import "~@angular/material/prebuilt-themes/indigo-pink.css";',
    });

    // change files to use preprocessor
    await updateJsonFile('angular.json', (workspaceJson) => {
      const appArchitect = workspaceJson.projects['test-project'].architect;
      appArchitect.build.options.styles = [{ input: `src/styles.${ext}` }];
    });

    await replaceInFile(
      'src/app/app.component.ts',
      './app.component.css',
      `./app.component.${ext}`,
    );

    // run build app
    await ng('build', '--source-map', '--configuration=development');
    await writeMultipleFiles({
      [`src/styles.${ext}`]: '@import "@angular/material/prebuilt-themes/indigo-pink.css";',
      [`src/app/app.component.${ext}`]:
        '@import "@angular/material/prebuilt-themes/indigo-pink.css";',
    });

    await ng('build', '--configuration=development');
  }
}
