import { writeFile, writeMultipleFiles } from '../../utils/fs';
import { ng } from '../../utils/process';

export default function () {
  // TODO(architect): Figure out what a minimal config is for architect apps.
  return;

  return Promise.resolve()
    .then(() =>
      writeFile(
        'angular.json',
        JSON.stringify({
          apps: [
            {
              root: 'src',
              main: 'main.ts',
              scripts: ['../node_modules/zone.js/dist/zone.js'],
            },
          ],
          e2e: { protractor: { config: './protractor.conf.js' } },
        }),
      ),
    )
    .then(() => ng('e2e', 'test-project-e2e'))
    .then(() =>
      writeMultipleFiles({
        './src/script.js': `
        document.querySelector('app-root').innerHTML = '<h1>app works!</h1>';
      `,
        './e2e/app.e2e-spec.ts': `
        import { browser, element, by } from 'protractor';

        describe('minimal project App', function() {
          it('should display message saying app works', () => {
            browser.ignoreSynchronization = true;
            browser.get('/');
            let el = element(by.css('app-root h1')).getText();
            expect(el).toEqual('app works!');
          });
        });
      `,
        'angular.json': JSON.stringify({
          apps: [
            {
              root: 'src',
              scripts: ['./script.js'],
            },
          ],
          e2e: { protractor: { config: './protractor.conf.js' } },
        }),
      }),
    )
    .then(() => ng('e2e', 'test-project-e2e'));
}
